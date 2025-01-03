import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {useSharedValue,useAnimatedStyle,withTiming} from 'react-native-reanimated';
import {TextInputField,GradientButton } from '../components/LogSignCmpnts';
import { calculateFontSize } from '../utils/FontUtils';
import { connect } from 'react-redux';
import { firebase } from '../../firebase';
import { useDispatch } from 'react-redux';
import { fetchUserData } from '../utils/FetchData';
import { useSelector } from 'react-redux';

const LoginScreen = () => {

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  /*
  Animation
  */
  const viewPosition = useSharedValue(1000);
  const animatedView = useAnimatedStyle(()=>{
    return{
      transform: [
        {
          translateY: viewPosition.value,
        },
      ],
    };
  });

  const signIn = () => {
    if (username !== '' && password !== '') {
      console.log('Attempting to sign in...');
      firebase.auth().signInWithEmailAndPassword(username, password)
        .then(async (userCredential) => {
          const user = userCredential.user.uid;
          console.log('From LoginScreen (UID)', user);
          const fetched = await fetchUserData(user,dispatch);
          console.log('Fetched:', fetched);
          if(fetched){
            await handleSignIn();
          }else{
            console.log('User data not found');
          }
        })
        .catch((error) => {
          console.log('Error code:', error.code);
          console.log('Error message:', error.message);
  
          if (error.code === 'auth/invalid-email') {
            console.log('That email address is invalid!');
          } else if (error.code === 'auth/user-not-found') {
            console.log('No user found with this email.');
          } else if (error.code === 'auth/wrong-password') {
            console.log('Incorrect password.');
          } else {
            console.error('An unexpected error occurred:', error);
          }
        });
    } else {
      console.log('Username and password cannot be empty');
    }
  };
  
  const handleSignIn = async () => {
    // Navigate to the NewScreen when login is pressed
    console.log('Signed User data:', user);
    
    navigation.navigate('Drawer', {userData: user});
  };

  const handleCreateAccount = () => {
    navigation.navigate('SignUp');
  };

  useEffect(()=>{
    viewPosition.value = withTiming(0,{duration: 1500});
  },[]);

  return (
    <View style={styles.container}>
      <Animated.View style={animatedView}>
          <View style={styles.loginBackgrondContainer}>
              <Image source={require("../assets/images/top_house2.png")} style={styles.backgroundImage}/>
          </View>
        <View style={styles.helloContainer}>
          <Text style={styles.helloText}>Welcome!</Text>
        </View>
        <View>
          <Text style={styles.loginText}>Login to your account</Text>
        </View>
        <TextInputField
          placeholder="Username or Email address"
          iconName="user"
          secureTextEntry={false}
          value={username}
          onChangeText={(text) => setUsername(text)}
          inputMode="email"
        />
       <TextInputField
          placeholder="Password"
          iconName="lock"
          secureTextEntry={true}
          value={password}
          onChangeText={(text) => setPassword(text)}
          inputMode="text"
        />
        <View style={styles.logInContainer}>
          <Text style={styles.logInText}>Log in</Text>
          <TouchableOpacity onPress={signIn}>
            <GradientButton
              colors={["#E99091", "#CD9D9E", "#B85455"]}
              iconName="arrowright"
              iconColor="white"
              iconSize={24}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleCreateAccount}>
        <Text style={styles.footerText}>Don't have an account? 
          <Text style={{textDecorationLine:"underline"}}>Create</Text>
        </Text>
        </TouchableOpacity>
        <View style={styles.blobContainer}>
          <Image source={require("../assets/images/lowBlob.png")} style={styles.lowBlob}/>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
    container:{
        backgroundColor: "#E4F1F4",
        flex: 1
    },loginBackgrondContainer:{
      height:'27%',
    },backgroundImage:{
      marginTop:'1%',
      height:"100%",
      width:"100%",
      resizeMode:'contain'
    },helloContainer:{
    },helloText:{
      textAlign:"center",
      fontSize: calculateFontSize(45) ,
      //fontWeight: 700,
      color: "#542F2F",
      fontFamily:'Fredoka-Bold'
    },loginText:{
      textAlign:"center",
      fontSize: calculateFontSize(22),
      fontFamily:'Fredoka-Bold',
      color: "#542F2F",
      marginBottom:'1%'
    },logInContainer:{
      flexDirection:"row",
      marginTop:'3%',
      marginHorizontal:'50%',
      width:"90%",
      justifyContent:'flex-start'
    },logInText:{
      color:"#542F2F",
      fontSize:calculateFontSize(27),
      fontFamily:'Fredoka-Bold',
      textAlign:"center"
    },footerText:{
      textAlign:"center",
      color:"black",
      fontSize:calculateFontSize(16),
      fontFamily:'Fredoka-Bold',
      marginTop:'1%'
    },blobContainer:{
      height:'50%',
      width:'50%',
      textAlign:'center',
      marginTop:'0%',
      zIndex:-1,
    },
    lowBlob:{
      resizeMode:'contain'
    }
})



export default LoginScreen;