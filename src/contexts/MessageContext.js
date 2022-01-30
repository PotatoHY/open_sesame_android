import React, { useEffect, useLayoutEffect, useContext, useState, createContext } from 'react'
import firestore from '@react-native-firebase/firestore';

import { AccountAuthContext } from '../contexts/AccountAuthContext'

export const MessageContext = createContext();

const MessageContextProvider = ({ children }) => {
  const [messages, setMessages] = useState([])
  const [friends, setFriends] = useState([])
  const [chatter, setChatter] = useState(null)
  const { user } = useContext(AccountAuthContext)

  const fetchUID = async (email) =>{
    const doc = await firestore()
      .collection('profiles')
      .doc(email)
      .get()
    return doc.data().uid
  }

  const fetchDisplayName = async (email) => {
    const doc = await firestore()
      .collection('profiles')
      .doc(email)
      .get()
    return doc.data().displayName
  }

  // friend lists and their last messages
  useLayoutEffect(() => {
    if (user) {
      firestore()
        .collection('friendList')
        .where('friend_email_pair', 'array-contains', user.email)
        .onSnapshot(querySnapshot => {
          let tempFriends = []
          querySnapshot.forEach( async (documentSnapshot) => {
            const email_pair = documentSnapshot.data().friend_email_pair
            const friend_email = email_pair[0] == user.email ? email_pair[1] : email_pair[0]
            const friend_uid = await fetchUID(friend_email)
            const friend_name = await fetchDisplayName(friend_email)
            // TODO: friend lists spazzing out after having new meesage in chat, subscribers are colliding
            firestore()
              .collection('chats')
              .where('sender_id_pair', 'in',[[user.uid, friend_uid], [friend_uid, user.uid]])
              .orderBy('createdAt','desc')
              .limit(1)
              .onSnapshot(querySnapshot => {
                // if the two friends has sent messages before
                if (querySnapshot.size)
                  tempFriends.push({
                    uid: friend_uid,
                    email: friend_email,
                    displayName: friend_name || "",
                    lastMessage: querySnapshot._docs[0].data()
                  })
                else 
                  tempFriends.push({
                    uid: friend_uid,
                    email: friend_email,
                    displayName: friend_name || ""
                  })
                setFriends(tempFriends)
              })
          })
        })
    }
  }, [user, messages])

  // each chat messages when clicked on a user
  useLayoutEffect(() => {
    if (chatter) {
      firestore()
        .collection('chats')
        .where('sender_id_pair', 'in',[[chatter.userID, user.uid], [user.uid, chatter.userID]])
        .orderBy('createdAt','desc')
        .onSnapshot(querySnapshot => {
          if (querySnapshot.size)
            setMessages(
              querySnapshot.docs.map(doc => ({
                _id: doc.data()._id,
                sender_id: doc.data().sender_id,
                _rid: doc.data()._rid,
                createdAt: doc.data().createdAt.toDate(),
                text: doc.data().text,
                user: doc.data().s_user,
                locked: doc.data().locked,
                file_url: doc.data().file_url,
                is_file : doc.data().is_file, 
              }))
            )
          else
            setMessages([])
        });
      }
  }, [chatter])

  return (
    <MessageContext.Provider
      value={{
        friends, messages, chatter, 
        setChatter, setMessages
      }}>
      {children}
    </MessageContext.Provider>
  )
  }
  
export default MessageContextProvider
