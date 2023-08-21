import styles from "@/styles/Home.module.scss"
import Recentcard from "./Recentcard"
import React from "react";
import { useState, useEffect, useRef } from "react";


export default function Recent(props){

    //get top anime from api
    useEffect(() => {
        getTopAnime();
      }, [])

    const [state, setState] =  useState([])
    const getTopAnime = async () => {
        const response = await fetch(`https://api.jikan.moe/v4/top/anime`).then(
            (res) => res.json()
          );
        setState(response.data);
    }


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
    const cards = state?.map((item) => {
        return <Recentcard key={item.mal_id} item={item} savemyfollow={props.savemyfollow}/>

    })
        if(!state) {
            return (<h1>loading</h1>)
        } else {

            return(
                <>
                    <h1 className={styles.sectionheading}>Top Rated</h1>
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
    }