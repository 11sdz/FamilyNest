import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfileById, isMomDadSonDaughter } from "../utils/ProfileUtils";
import avatarImages from "../utils/AvatarsUtils";
import { calculateFontSize } from "../utils/FontUtils";
import * as Animatable from "react-native-animatable";
import LottieView from "lottie-react-native";
import { getContentByReward } from "../utils/RewardUtils";
import { setReduxProfiles } from "../Redux/userSlice";
import { firebase } from "../../firebase";
import { fetchUserData } from "../utils/FetchData";
import { BarChart } from "react-native-chart-kit";
import { chartConfig } from "../utils/ChartUtils";
import { Dimensions } from "react-native";
import { getStartAndEndOfWeek } from "../utils/TimeUtils";

const ProfileScreen = () => {
  const screenWidth = Dimensions.get("window").width;

  const user = useSelector((state) => state.user.user);
  const selectedUser = useSelector(
    (state) => state.selectedProfile.selectedProfileId
  );
  const dispatch = useDispatch();
  const profile = getProfileById(user, selectedUser);
  const parental = profile.role === "child" ? false : true;
  const familyRole = isMomDadSonDaughter({ profile });

  const profileImage = profile.imageID
    ? avatarImages[profile.imageID]
    : { uri: profile.avatarURI };

  const formatDate = (dateString) => {
    // Split the date string into components
    const [year, month, day] = dateString.split("-");

    // Return the reformatted date
    return `${day}/${month}/${year}`;
  };

  const today = new Date();
  const formattedToday = today.toISOString().slice(0, 10);

  let updated_profile = getProfileById(user, selectedUser);

  const [dailyAvailable, setDailyAvailable] = useState(
    updated_profile.latest_daily_login !== formattedToday
  );


  const [childProfiles,setChildProfiles]= useState(user.profiles.filter((profile)=> profile.role==='child'))
  const { startOfWeek, endOfWeek } = getStartAndEndOfWeek();
  const filteredData = childProfiles.map((profile) => ({
    name: profile.name,
    tasksThisWeek: profile.tasks_completed.filter((task) => {
      const taskDate = new Date(task.completed_at);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    }).length,
  }));

  const data = {
    labels: filteredData.map((profile) => profile.name),
    datasets: [
      {
        data: filteredData.map((profile) => profile.tasksThisWeek),
      },
    ],
  };


  const confettiAnimationRef = useRef(null);
  const [confettiPlay, setConfettiPlay] = useState(false);

  useEffect(() => {
    // Function to execute every minute
    const interval = setInterval(() => {
      fetchUserData(user.uid, dispatch);
      updated_profile = getProfileById(user, selectedUser);
      setDailyAvailable(updated_profile.latest_daily_login !== formattedToday);
    }, 15000); // 0.5 minute

    // Cleanup the interval when the component unmounts
    return () => clearInterval(interval);
  }, [updated_profile]); // Empty dependency array to run only once

  const handleConfettiShootFinish = () => {
    setConfettiPlay(false);
    setDailyAvailable(false);
  };

  const handleDailyLogin = async () => {
    console.log("Daily login clicked");

    if (dailyAvailable) {
      try {
        const userDocRef = firebase
          .firestore()
          .collection("users")
          .doc(user.uid);

        const doc = await userDocRef.get();
        if (doc.exists) {
          const data = doc.data();
          const tasks = data.tasks;
          const profiles = data.profiles;

          const profileIndex = profiles.findIndex((p) => p.id === profile.id);
          if (profileIndex !== -1) {
            const today = new Date();
            // Format the date to YYYY-MM-DD
            const formattedToday = today.toISOString().slice(0, 10);

            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            // Format yesterday's date to YYYY-MM-DD
            const formattedYesterday = yesterday.toISOString().slice(0, 10);

            const onStreak =
              profiles[profileIndex].latest_daily_login === formattedYesterday
                ? true
                : false;

            profiles[profileIndex].streak = onStreak
              ? profiles[profileIndex].streak + 1
              : 1;
            profiles[profileIndex].latest_daily_login = formattedToday;
            profiles[profileIndex].points += 10;

            await userDocRef.update({ profiles });

            const updatedProfiles = [...user.profiles];

            updatedProfiles[profileIndex] = {
              ...updatedProfiles[profileIndex],
              points: profiles[profileIndex].points,
            };
            dispatch(setReduxProfiles(updatedProfiles));
            setConfettiPlay(true);
            if (confettiAnimationRef.current) {
              confettiAnimationRef.current.play(); // Play the animation on press
            }

            console.log(
              `Daily login collected streak is now ${profiles[profileIndex].streak} and latest date collected is ${profiles[profileIndex].latest_daily_login}.`
            );
          } else {
            console.error("Assigned profile not found.");
          }
        } else {
          console.error("User document not found.");
        }
      } catch (error) {
        console.error("Error approving task:", error);
      }
    } else {
      console.log("Already collected today...");
    }
  };


  const formatStartEndDate = (date) => {
    return new Intl.DateTimeFormat("en-GB").format(date); // en-GB formats to DD/MM/YYYY
  };

  const renderReward = ({ item }) => {
    const height = 80;
    const width = 80;

    return (
      <View style={styles.rewardAnimation}>
        <LottieView
          source={getContentByReward(item.reward)}
          style={{ width: width, height: height }}
          autoPlay={true}
          loop={false}
        />
        <Text style={[styles.rewardText, { alignSelf: "center" }]}>
          {item.reward}
        </Text>
        <View style={{ flexDirection: "row", alignSelf: "center" }}>
          <Text style={[styles.rewardText, { alignSelf: "center" }]}>
            Price: {item.price}{" "}
          </Text>
          <Animatable.View
            animation="swing"
            duration={1500}
            iterationCount="infinite"
            style={[styles.coinStyle, { height: 20, width: 20 }]}
          >
            <Text style={[styles.rewardText, { alignSelf: "center" }]}>$</Text>
          </Animatable.View>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/backgrounds/pattern_2.png")}
      resizeMode="cover"
      imageStyle={{ width: "100%", opacity: 0.2 }} // Adjust opacity here
    >
<View>
        <Text style={styles.boldText}>My Profile:</Text>
        <ImageBackground
          source={require("../assets/backgrounds/pattern_1.png")}
          resizeMode="stretch"
          imageStyle={{ width: "115%", opacity: 0.3 }} // Adjust opacity here
          style={[
            styles.profileContainer,
            {
              backgroundColor:
                profile.gender === "female" ? "#FFE5E1" : "#9EF4E6",
            },
          ]}
        >
          <Image source={profileImage} style={styles.avatarImage} />
          <View style={styles.detailsContainer}>
            <Text style={styles.semiBoldText}>{profile.name}</Text>
            <Text style={styles.semiBoldText}>{familyRole}</Text>
            <Text style={styles.semiBoldText}>
              {formatDate(profile.birth_day)}
            </Text>
            {!parental && (
              <View style={{ flexDirection: "row" }}>
                <Text style={styles.semiBoldText}>Points: </Text>
                <Animatable.View
                  animation="swing"
                  duration={1500}
                  iterationCount="infinite"
                >
                  <View style={styles.coinStyle}>
                    <Text style={styles.semiBoldText}>{profile.points}</Text>
                  </View>
                </Animatable.View>
              </View>
            )}
          </View>
        </ImageBackground>
        <View style={{ height: 8 }} />
        {!parental && (
          <View style={styles.achievementsContainer}>
            <Text
              style={[styles.boldText, { fontSize: calculateFontSize(25) }]}
            >
              My Achievements:
            </Text>
            <Text
              style={[styles.regularText, { fontSize: calculateFontSize(14) }]}
            >
              Tasks completed: {profile.tasks_completed.length} , Login streak:{" "}
              {updated_profile.streak}
            </Text>
            <View
              style={{ height: 2, backgroundColor: "#555", marginBottom: 20 }}
            />
            <FlatList
              data={profile.rewards}
              renderItem={renderReward}
              keyExtractor={(item) => String(item.id)}
              numColumns={4} // Three avatars per row
              contentContainerStyle={styles.rewardList}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 14,
                    marginHorizontal: 10,
                  }}
                />
              )}
            />
          </View>
        )}
        {!parental && (
          <TouchableOpacity
            style={[
              styles.dailyButton,
              {
                backgroundColor: dailyAvailable
                  ? "rgba(164, 220, 116, 0.88)"
                  : "rgba(179, 179, 179, 0.88)",
              },
            ]}
            onPress={handleDailyLogin}
          >
            <Text style={styles.boldText}>Daily Login!</Text>
          </TouchableOpacity>
        )}
        {confettiPlay && (
          <View style={styles.lottieContainer} pointerEvents="box-none">
            <LottieView
              source={require("../assets/animations/confetti-shoot.json")}
              style={{
                position: "absolute",
                top: 420,
                left: 40,
                width: 350,
                height: 350,
              }}
              autoPlay={true}
              loop={false}
              speed={1}
              pointerEvents="none" // Ensures it doesn't block touches
              ref={confettiAnimationRef}
              onAnimationFinish={handleConfettiShootFinish}
            />
          </View>
        )}
        {parental && <View style={{alignSelf:'center'}}>
          <View style={{height:10}}/>
          <Text style={[styles.semiBoldText,{textAlign:'center'}]}>Tasks completed this week{"\n"}{formatStartEndDate(startOfWeek)}-{formatStartEndDate(endOfWeek)}</Text>
          <BarChart
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            data={data}
            width={screenWidth*0.9}
            fromZero={true} // Ensures the y-axis starts from 0
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1} // Forces y-axis to use steps of 1
            height={220}
            chartConfig={{
              ...chartConfig,
              propsForBackgroundLines: {
                strokeDasharray: "", // Optional: to make solid lines
                strokeWidth: 1,
              },
            }}
            verticalLabelRotation={0}
          />
        </View>}
      </View>
    </ImageBackground>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E4F1F4",
    padding: "2",
  },
  profileContainer: {
    flexDirection: "row",
    padding: 20,
    elevation: 10,
    width: "90%",
    alignSelf: "center",
    marginTop: 10,
    borderRadius: 10,
  },
  avatarImage: {
    height: 145,
    width: 145,
    alignSelf: "flex-start",
    borderWidth: 2,
    marginTop: 3,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  semiBoldText: {
    fontFamily: "Fredoka-Medium",
    fontSize: calculateFontSize(20),
    marginTop: 3,
  },
  coinStyle: {
    backgroundColor: "#F3C623",
    borderRadius: 50,
    borderColor: "black",
    borderWidth: 2,
    width: 35,
    height: 35,
    alignContent: "center",
    alignItems: "center",
  },
  boldText: {
    fontFamily: "Fredoka-Bold",
    fontSize: calculateFontSize(30),
    textAlign: "center",
    color: "#333",
  },
  rewardList: {},
  rewardText: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: calculateFontSize(14),
  },
  rewardAnimation: {
    backgroundColor: "white",
    padding: 5,
    marginRight: 4,
    marginLeft: 4,
    elevation: 8,
    borderRadius: 12,
  },
  achievementsContainer: {
    marginTop: 20,
    alignSelf: "center",
    maxHeight: 400,
    backgroundColor: "rgba(255, 255, 255, 0.57)", // Adjust the color and transparency
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dailyButton: {
    marginTop: 20,
    backgroundColor: "rgba(164, 220, 116, 0.88)", // Adjust the color and transparency
    padding: 20,
    width: "70%",
    alignSelf: "center",
    borderRadius: 30,
    borderWidth: 3,
    elevation: 10,
  },
  regularText: {
    fontFamily: "Fredoka-Regular",
    fontSize: calculateFontSize(30),
    textAlign: "center",
    color: "#333",
  },
  lottieContainer: {
    ...StyleSheet.absoluteFillObject, // Covers the entire screen
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1, // Ensure it's behind the TouchableOpacity
  },
});
