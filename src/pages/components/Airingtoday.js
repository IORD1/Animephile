import styles from "@/styles/Home.module.scss"
import AiringCard from "./AiringCard";
import React from "react";
import { useState, useEffect, useRef } from "react";


export default function Airingtoday(props){

    //get top anime from api
    useEffect(() => {
        const d = new Date();
        let day = d.getDay();
        let dayslist = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
            
        const getTopAnime = async () => {
            const response = await fetch(`https://api.jikan.moe/v4/schedules/${dayslist[day]}`).then(
                (res) => res.json()
              );
            setState(response.data);
            // console.log(response.data);
        }
    
        getTopAnime();
      }, [])

    const [state, setState] =  useState([]);

  

    //scroll section
    const scrollRef = useRef(null);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollInterval, setScrollInterval] = useState(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        // start scrolling automatically
        const interval = setInterval(() => {
        setScrollLeft(scrollLeft => scrollLeft + 1);
        }, 30);

        setScrollInterval(interval);

        // clean up interval on unmount
        return () => clearInterval(interval);
    }, []);

    const handleScroll = event => {
        // update scrollLeft state when scrolling
        setScrollLeft(event.target.scrollLeft);
    };

    const handlePauseScroll = () => {
        // pause scrolling on hover
        clearInterval(scrollInterval);
        setIsHovering(true);
    };

    const handleResumeScroll = () => {
        // resume scrolling on hover out
        const interval = setInterval(() => {
        setScrollLeft(scrollLeft => scrollLeft + 1);
        }, 30);

        setScrollInterval(interval);
        setIsHovering(false);
    };

    const handleScrollLeft = () => {
        // scroll left on button click
        scrollRef.current.scrollLeft -= 600;
    };

    const handleScrollRight = () => {
        // scroll right on button click
        scrollRef.current.scrollLeft += 600;
    };

    //mapping data to cards
    const cards = state?.map(item => {
        return (
            <AiringCard key={item.mal_id} item={item} savemyfollow={props.savemyfollow}/>
        )
    })
        
        return(
            <>
                <h1 className={styles.sectionheading}>Top Episodes Airing today</h1>
                <div className={styles.container_recent}>
                    <div 
                    className={styles.recentcontainer}
                    ref={scrollRef}
                    onScroll={handleScroll}
                    onMouseEnter={handlePauseScroll}
                    onMouseLeave={handleResumeScroll}
                    >
                    {cards}
                    </div>
                    <div className={styles.buttons}>
                        <button onClick={handleScrollLeft} disabled={isHovering || scrollLeft <= 0}>
                        {'<'}
                        </button>
                        <button onClick={handleScrollRight} >
                        {'>'}
                        </button>
                    </div>
                </div>
            </>
        )
    }