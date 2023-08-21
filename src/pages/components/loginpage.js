import styles from "@/styles/Loginstyle.module.css";
import Image from "next/image";
import arrowsvg from './assests/arrow_forward_FILL0_wght400_GRAD0_opsz48.svg'
import { Megrim } from 'next/font/google'
import Applogo from "./applogo";
// import Pattern from './assests/pattern.jpg';
const megrim = Megrim({ 
    weight: '400',
    subsets: ['latin'],
})
export default function Login(props){

  function func1(){
    props.loginfunc();

  }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <Applogo />
                <p className={styles.card__content}>Get Reminders for Lates episodes releases.
                </p>
                <div className={styles.card__form}>
                    <button className={styles.signup} id="googlebtn" onClick={func1}> 
                        <div className={styles.button__content}>
                            <p>Login with Google</p> 
                            
                            <Image src={arrowsvg} alt="->" height={22}  color="white"/>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}