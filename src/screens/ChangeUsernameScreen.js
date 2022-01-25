import React, { useContext, useState, useEffect } from 'react';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import { Button, Text, Title, TextInput } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { AccountAuthContext } from '../contexts/AccountAuthContext'

export default function ChangeUsernameScreen({ navigation }) {
  const { user } = useContext(AccountAuthContext)
    const [newUserName, setNewUserName] = useState('')

    const changeName = async () => {
      const profile = {
        displayName: newUserName,
      }
      await user.updateProfile(profile)
    }
    return (
      <View>
        <TextInput
            label="NewUserName"
            numberOfLines={1}
            onChangeText={(newUserName) => setNewUserName(newUserName)}
        />
        <Button
            onPress={ () => changeName()}
        >Change Username</Button>
      </View>
    );
}
