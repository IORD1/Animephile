import styles from "@/styles/RecentCard.module.scss"
import style from "@/styles/Home.module.scss"
export default  function Recentcard(props){

    let url = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Fpremium-vector%2Fmystical-child-anime-error-404-page-found_30246586.htm&psig=AOvVaw1rzZhpqlKmQhUp3NTEjkzf&ust=1692862576262000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCOjvi9ai8oADFQAAAAAdAAAAABAE";
    let myStyle = {
        backgroundImage: `url(${url})`
    }
    let tit = "Title not found";
    let syn = "Synopsis not found";
    let vidurl = "https://www.youtube.com";
    let rating = "n/a"


    if(props.item){
         url = props.item.images.webp.large_image_url;
         myStyle = {
            backgroundImage: `url(${url})`
        }
         tit = props.item.title;
         syn = props.item.synopsis.slice(0,100)
         vidurl = props.item.trailer.url;
         rating = props.item.score;
    
    }

    function followit(){
        props.savemyfollow(tit);
    }
   
    return(
        <div className={style.recentcard}>
            <div className={styles.card}>
                <div className={styles.card__inner} style={myStyle}>                    
                </div>
                <main className={styles.card__body}>
                        <h1 className={styles.card__title}>{tit}</h1>
                    
                        <p className={styles.card__slug}>{syn}...</p>
                    
                        <a href={vidurl} target="_blank">
                            <button className={styles.card__btn} value="Watch trailer" >Watch trailer</button>
                        </a>
                        <button onClick={() => {followit()}} className={styles.card__btn2} value="follow" >Follow</button>
                        

                        <div className={styles.card__rating}>
                            Rating : {rating}
                        </div>
                </main>
                
            </div>
        </div>
    )
}