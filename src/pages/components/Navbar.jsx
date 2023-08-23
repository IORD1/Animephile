import styles from "@/styles/Home.module.scss";
import Applogo from "./applogo";
// import Search from "./Search";
import Image from "next/image";
// import { useRouter } from "next/router";
export default function Navbar (props){
    function logoutme(){
        props.logout();
    }

    let name = "User";
    if(props.item){
        name = props.displayname.split(" ")[0];
    }
    // const router = useRouter()
    // function handleClick(){
    //     const data = {
    //         email: props.email,
    //         uid: props.uid,
    //     };

    //     router.push(
    //         {
    //             pathname: '/following',
    //             query:data,
    //         }
    //     );
    // };

    return (
        <div className={styles.container}>
            <nav>

                <Applogo />
                <div className={styles.nav2}>
                    {/* <Search /> */}
                    <p className={styles.hiuser} >Welcome, {name}</p>
                    <button className={styles.logoutbtn} onClick={logoutme}>LogOut</button>
                    {/* <button className={styles.logoutbtn} onClick={handleClick}>Following</button> */}
                    
                    {/* <Image width={"0"} height={"0"} alt="profile" src={props.profileurl} className={styles.profile}></Image> */}
                </div>
            </nav>
        </div>
    );
}