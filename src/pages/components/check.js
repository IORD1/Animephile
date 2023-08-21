import styles from "@/styles/Checkbutton.module.css";
import { Megrim } from 'next/font/google'
import { useEffect,useState } from "react";

const megrim = Megrim({ 
    weight: '400',
    subsets: ['latin'],
})
export default function Check(props){
  const [schedule, setSchedule] =  useState([])

  var days = "";
  let titlearray = [];
  
  function sendRequest(list){
    props.sendUpdate(list);
  }
  const d = new Date();
  let day = d.getDay();
  let dayslist = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  const getShedule = async () => {
    const response = await fetch(`https://api.jikan.moe/v4/schedules/${dayslist[day]}`).then(
            (res) => res.json()
          );
        setSchedule(response.data);
        console.log(response.data)
    for(let i in response.data){
      titlearray.push(response.data[i].title);
    }
    sendRequest(titlearray);
  }

  function func1(){
    getShedule();
  }

    return (
        <div className={styles.container}>
            <button onClick={func1} className={styles.logoutbtn}>Check Updates</button>
        </div>
    );
}