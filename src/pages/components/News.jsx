import styles from "@/styles/Home.module.scss"
import Newscard from "./Newscard"
import { useState, useEffect, useRef } from "react";
export default  function News(){

    useEffect(() => {
        setTimeout(() => {
            getManga(); 
        }, 2000)
      }, [])

    const [stateNews, setStateNews] =  useState([])
    const getManga = async () => {
        try{
            const resp = await fetch(`https://api.jikan.moe/v4/manga`).then(
                (res) => res.json()
              );
            setStateNews(resp.data);
        }catch(err){
            console.log(err);
        }
        // console.log(resp.data);
    }
    const cards = stateNews?.map(item => {
        return (
            <Newscard key={item.mal_id} item={item}/>
        )
    })
    return(
        <>
        <h1 className={styles.sectionheading}>Buzz Today</h1>
        <div className={styles.newscontainer}>
           {cards}
        </div>
        </>
    )
}