import styles from "@/styles/RecentCard.module.scss"
import style from "@/styles/Home.module.scss"
export default  function AiringCard(props){

    function popup(){
        
    }
    const url = props.item.images.webp.large_image_url;
    const myStyle = {
        backgroundImage: `url(${url})`
    }
    const tit = props.item.title;

    function followit(){
        props.savemyfollow(tit);
    }
   
    return(
        <div className={style.recentcard}>
            <div className={styles.card}>
                <div className={styles.card__inner} style={myStyle}>
                    {/* <div className={styles.filter}></div> */}
                </div>
                <main className={styles.card__body}>
                    <div className={styles.card__info}>
                        <h1 className={styles.card__title}>{(props.item.title_english) ? props.item.title_english : props.item.title}</h1>
                        <button onClick={() => {followit()}} className={styles.card__btn2} value="follow" >Follow</button>
                        <a href={props.item.trailer.url} target="_blank">
                            <button className={styles.card__btn} value="Watch trailer" >Watch trailer</button>
                        </a>

                        <div className={styles.card__rating}>
                            <strong>Broadcast  </strong>  : {props.item.broadcast.string} (3:30 hrs ahead of IST)
                        </div>
                        <div className={styles.card__rating}>
                            <strong>Current Episode  </strong>  : {props.item.episodes} 
                        </div>
                        {/* <div className={styles.card__rating}>
                            {props.item.genres[0].name} 
                        </div> */}
                        {/* {console.log(props.item.genres[0].)} */}

                    </div>
                </main>
            
            </div>
        </div>
    )
}