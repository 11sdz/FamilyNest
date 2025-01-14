import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import NewScreen from "./NewScreen";
import SelectProfileScreen from "./SelectProfileScreen";
import { calculateFontSize } from "../utils/FontUtils";
import avatarImages from "../utils/AvatarsUtils";
import { useDispatch, useSelector } from "react-redux";
import { setReduxProfiles, addReduxTask } from "../Redux/userSlice";
import { setSelectedProfileId } from "../Redux/selectedProfileSlice";
import { uploadUserData } from "../utils/UploadData";
import {
  CreateNewProfile,
  getNewProfileID,
  getProfileById,
  getProfileAge,
} from "../utils/ProfileUtils";
import ProfileBar from "../components/ProfileBar";
import CreateTask from "../components/CreateTask";
import Task from "../components/Task";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList } from "react-native-gesture-handler";

const Home = ({ navigation, route }) => {
  const user = useSelector((state) => state.user.user);
  const selectedUser = useSelector(
    (state) => state.selectedProfile.selectedProfileId
  ); //
  const dispatch = useDispatch();
  console.log("User logged (SelectProfileScreen):", user);
  console.log("id", selectedUser);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false); // To track if the upload is in progress
  const profile = getProfileById(user, selectedUser); // Always up-to-date
  const parental = profile ? profile.role === "parent" : true; // Always up-to-date
  const [tasks,setTasks] = useState(user.tasks)
  const [task, setNewTask] = useState();


  console.log("task", task);
  console.log('tasks Available',tasks)

  useEffect(() => {
    const uploadTask = async () => {
      if (task && !loading) {
        try {
          console.log("task to upload", task);
          setLoading(true); // Set loading to true while uploading
          await dispatch(addReduxTask(task)); // Dispatch task to Redux

          // Wait for the next render to pick up the updated Redux state
          const updatedUser = { ...user, tasks: [...user.tasks, task] };

          await uploadUserData(user.uid, updatedUser); // Wait for user data upload to complete
          console.log("Task uploaded successfully!");
          console.log('tasks')
        } catch (error) {
          console.error("Error uploading task:", error);
        } finally {
          setLoading(false); // Reset loading once the task is uploaded
          setNewTask(null); // Reset the task after the upload
          console.log('seng tasks ', user.tasks)
          setTasks(user.tasks)
        }
      }
    };
    setTasks([...tasks].sort((a, b) => {
      const now = new Date();
      const endTimeA = new Date(a.endTime);
      const endTimeB = new Date(b.endTime);
    
      // If both tasks have future end times, sort them by endTime
      if (endTimeA > now && endTimeB > now) {
        return endTimeA - endTimeB;
      }
    
      // If only one of the tasks has a future endTime, place it before the past one
      if (endTimeA > now) return -1;
      if (endTimeB > now) return 1;
    
      // If both tasks have passed end times, sort them by endTime in ascending order
      return endTimeA - endTimeB;
    }));
    uploadTask();
  }, [task, dispatch, user, uploadUserData, loading]); // Re-run effect when task or user


  const renderItem = ({item}) =>{
    console.log('task rendering',item)
    return <TouchableOpacity onPress={()=>openTaskScreen({taskID:item.id})} style={{padding:5}}><Task task={{item}}/></TouchableOpacity>
  }

  const openTaskScreen =({taskID})=>{
    navigation.navigate('TaskScreen',{taskID:taskID});
  }

  console.log('use111r',tasks)

  return (
    <ImageBackground style={styles.container}
    source={require('../assets/backgrounds/pattern_2.png')}
    resizeMode="cover">
      <View style={{ marginTop:'5%' ,width: "90%", height: "10%" }}>
        <ProfileBar profile={profile} />
      </View>
      {showModal && parental && (
        <CreateTask
          showModal={showModal}
          setShowModal={setShowModal}
          user={{ user }}
          profile={{ profile }}
          task={task}
          setNewTask={setNewTask}
        />
      )}
      {parental && <TouchableOpacity onPress={() => setShowModal(true)}
        style={{padding:10}}>
        <LinearGradient
          style={styles.createTaskButton}
          colors={["#76E2F4", "#615DEC", "#301781"]}
        >
          <Text
            style={{
              fontFamily: "Fredoka-Bold",
              fontSize: calculateFontSize(20),
              padding:10,
              textAlign:'center'
            }}
          >
            Create new task
          </Text>
        </LinearGradient>
      </TouchableOpacity>}
      <View style={styles.tasksContainer}>
        <FlatList
          numColumns={2}
          data={tasks} // List of profiles
          keyExtractor={(item) => item.id.toString()} // Ensure the id is converted to string
          renderItem={renderItem} // Render each item using ProfileBar
          contentContainerStyle={styles.contentContainerStyle}
          ItemSeparatorComponent={() => <View style={styles.separator}/>}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E4F1F4",
    alignItems: "center",
    padding:'2'
  },
  headerText: {
    fontSize: calculateFontSize(48),
    fontWeight: "bold",
    color: "#542F2F",
    marginBottom: "10%",
  },
  button: {
    width: "17%",
    height: "8%",
    borderRadius: 800,
    backgroundColor: "#B85455",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: calculateFontSize(30),
    color: "white",
    fontWeight: "bold",
  },
  avatarCircle: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginBottom: "5%",
    width: 100, // Adjust the width as needed
    height: 100, // Adjust the height as needed
    borderRadius: 50, // Make it a circle
    overflow: "hidden", // Ensure the image is contained within the circle
  },
  avatarImage: {
    width: "100%", // Adjust the width to fill the circle
    height: "100%", // Adjust the height to fill the circle
    resizeMode: "cover",
  },
  tasksContainer: {
    height: "80%",
    width: "90%",
    //backgroundColor:'white',
    //borderWidth:2,
    //borderColor:'grey',
    //elevation: 5,
    borderRadius: 10,
    alignContent:'center',
    justifyContent:'center',
  },
  createTaskButton: {
    borderRadius: 10,
    width: "90%",
  },contentContainerStyle:{
    flexGrow: 1,
    alignItems: 'center',
  }, separator: {
    height: '2%', // Adjust height for horizontal line
    width: '90%', // Adjust width as needed
    backgroundColor: '#aaa',
    alignSelf: 'center',
  },
});

export default Home;
