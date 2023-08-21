import styles from "@/styles/Loginstyle.module.css";
import { Megrim } from 'next/font/google'
const megrim = Megrim({ 
    weight: '400',
    subsets: ['latin'],
})
export default function Applogo(){
    return (
        <span className={ megrim.className} id={styles.logoanime}>ANIMEPHILE</span>
    );
}