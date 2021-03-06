import React, { createContext, useContext, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import AudioRecord from 'react-native-audio-record'
import storage from '@react-native-firebase/storage'

import { AccountAuthContext } from '../contexts/AccountAuthContext'

export const VoiceAuthContext = createContext();
const SVTHRESHOLD = 10
const SRTHRESHOLD = 50

const VoiceAuthContextProvider = ({ children }) => {
  const { user } = useContext(AccountAuthContext)

  const [recording, setRecording] = useState(false)
  const [verified, setVerified] = useState(false)

  const options = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    audioSource: 6,
    wavFile: 'test.wav'
  }

  const uploadToFirebase = async (file, referenceUrl) => {
    const reference = storage().ref(referenceUrl);
    await reference.putFile(file).then(() => {
      console.log('Audio uploaded to the bucket!');
    });
    const url = await reference.getDownloadURL();
    return url
  }

  const onStartRecord = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Permissions for record audio',
            message: 'Give permission to your device to record audio',
            buttonPositive: 'ok',
          },
        )
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) 
          return false
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    AudioRecord.init(options);
    AudioRecord.start();
    setRecording(true)
  }

  const onStopEnroll = async () => {
    const audioFile = await AudioRecord.stop();
    setRecording(false)
    const downloadUrl = await uploadToFirebase(audioFile, `voicedata/${user.uid}/enroll.wav`)

    var success = false
    await fetch(`http://35.215.151.189:8080/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: `{"url": "${downloadUrl}", "user": "${user.uid}"}`
    }).then(async (response) => {
      const returnResults = await response.json()
      if (returnResults.url === downloadUrl)
        success = true
    }).catch((err) => {
      Alert.alert("Network Error", err.toString())
    })
    return success
  }

  const onStopVerify = async (digits) => {
    const audioFile = await AudioRecord.stop();
    setRecording(false)
    const downloadUrl = await uploadToFirebase(audioFile, `voicedata/${user.uid}/verify.wav`)

    var returnObj = {
      networkSuccess: false,
      thresholdPassed: false,
      speechPassed: false
    }
    
    // Speaker Verification
    await fetch(`http://35.215.151.189:8080/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: `{"url": "${downloadUrl}", "user": "${user.uid}", "digits": "${digits}"}`
    }).then(async (response) => {
      const returnResults = await response.json()
      // TODO: why tfis the score so high bruh
      if (returnResults.url === downloadUrl)
        returnObj.networkSuccess = true
      if (parseFloat(returnResults.svScore) > SVTHRESHOLD)
        returnObj.thresholdPassed = true
      if (parseFloat(returnResults.srError) < SRTHRESHOLD)
        returnObj.speechPassed = true
      console.log(returnResults.srError)
      console.log(returnResults.decodedDigits)
    }).catch((err) => {
      Alert.alert("Network Error", err.toString())
    })

    if (Object.values(returnObj).every(item => item == true)) {
      setVerified(true)
      setTimeout(() => setVerified(false), 5 * 60 * 1000);
    }
    // TODO: make timeout customizable when settings are ready

    return returnObj
  }

  return (
      <VoiceAuthContext.Provider
          value={{
            recording,
            verified,
            onStartRecord,
            onStopEnroll,
            onStopVerify
          }}
      >
        {children}
      </VoiceAuthContext.Provider>
  );
};

export default VoiceAuthContextProvider
