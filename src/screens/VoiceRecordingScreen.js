import React, { useContext, useState, useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native'
import { Button, Title } from 'react-native-paper'

import { VoiceAuthContext } from '../contexts/VoiceAuthContext'


export default function VoiceEnrollScreen({ route, navigation }) {
  const { option } = route.params
  const { recording, onStartRecord, onStopEnroll, onStopVerify } = useContext(VoiceAuthContext)
  const [ recordText, setRecordText ] = useState('')
  const [ randNum, setRandNum ] = useState('')

  useEffect(() => {

    var digits = [0,1,2,3,4,5,6,7,8,9],
    randNums = [],
    j = 0;

    // generate non-repeating 6-digit number
    while (digits.length > 4) {
      j = Math.floor(Math.random() * (digits.length + 1));
      randNums.push(digits[j]);
      digits.splice(j,1);
    }
    setRandNum(randNums.join(''))
  }, [])

  return (
      <View style={styles.container}>
        <Text style={styles.instructions}>Record yourself saying the following numbers:</Text>
        <Text style={styles.titleText}> { randNum } </Text>
        <TouchableOpacity style={styles.recordOverlay} >
          <Button
            mode="contained"
            style={styles.recordButton}
            labelStyle={styles.recordButtonLabel}
            onPress={ async () => {
              if (!recording){
                onStartRecord()
                setRecordText("Recording...")
              } else {
                setRecordText((option === 'enroll') ? "Enrollment in process..." : "Verification in process...")
                
                if (option === "enroll") {
                  if (await onStopEnroll())
                    Alert.alert("Enrollment complete", "Your voice will be saved in your account. You can always enroll again for a different voiceprint", [
                      { text: "OK", onPress: () => navigation.navigate('Message') }
                    ]) 
                }
                else if (option === "verify") {
                  const results = await onStopVerify()
                  if (results.thresholdPassed) {
                    Alert.alert("Verification success", "You can now view the message.", [
                      { text: "OK", onPress: () => navigation.navigate('Message') } 
                      // TODO: after binding the verification with locaked message, set message to unlocked
                    ]) 
                  }
                  else {
                    Alert.alert("Verification failed", "Your voice data does not match our voice data on the database.", [
                      { text: "OK", onPress: () => navigation.navigate('Message') } 
                      // TODO: after binding the verification with locaked message, set message to unlocked
                    ]) 
                  }
                }
                else 
                  Alert.alert(`Failed to ${option}`, "This is probably a problem on our side. Please try again.", [
                    { text: "OK", onPress: () => setRecordText("") } 
                    // TODO: after binding the verification with locaked message, set message to unlocked
                  ]) 
              }
            }}
          >{recording ? "Stop" : "Start"}</Button>
        </TouchableOpacity>
        <Text
          style={styles.recordText}
        >{ recordText }</Text>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    margin: 10,
    fontSize: 18,
    color: "black"
  },
  recordButton: {
    width: 100,  
    height: 100,   
    borderRadius: 50,
    backgroundColor: '#00ffff',
    position: 'absolute',
  },
  recordButtonLabel: {
    paddingTop: 33,
    color: '#000000',
  },
  recordOverlay: {
    width:100,
    height:100,
    borderRadius:50,
    borderWidth: 1,
    borderColor:'rgba(0,0,0,0.2)',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#fff',
  },
  recordText: {
    fontSize: 18,
    color: '#006400',
  },
  titleText: {
    fontSize: 32,
    marginBottom: 10,
  },
});
