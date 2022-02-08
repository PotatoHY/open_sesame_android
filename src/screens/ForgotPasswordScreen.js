import React, { useContext, useState, useEffect } from 'react';
import { Alert, Dimensions, StyleSheet, View } from 'react-native';
import { Button, Text, Title, TextInput } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import { AccountAuthContext } from '../contexts/AccountAuthContext'
import auth from '@react-native-firebase/auth';

export default function ForgotPasswordScreen({ navigation }) {
    const user = auth().currentUser;
    const [currentEmail, setEmail] = useState('')
    const { reset } = useContext(AccountAuthContext)

    return(
        <View>
            <TextInput
                label="Enter your registered email here"
                numberOfLines={1}
                onChangeText={(currentEmail) => setEmail(currentEmail)}
                />
            <Button
                uppercase={false}
                onPress={ () => { reset(currentEmail) }}
            >Send Reset Password Email </Button>
        </View>
    );
}