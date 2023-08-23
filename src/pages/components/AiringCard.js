import styles from "@/styles/RecentCard.module.scss"
import style from "@/styles/Home.module.scss"
export default  function AiringCard(props){

    // const url = props.item.images.webp.large_image_url;

    let tit = "Your title";  
    let url = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Fpremium-vector%2Fmystical-child-anime-error-404-page-found_30246586.htm&psig=AOvVaw1rzZhpqlKmQhUp3NTEjkzf&ust=1692862576262000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCOjvi9ai8oADFQAAAAAdAAAAABAE";

    if(props.item){
        tit = props.item.title;
        url = props.item.images.webp.large_image_url;
       
    } 
    const myStyle = {
        backgroundImage: `url(${url})`
    }

    // const somethingelse = {
    //     backgroundColor : "black"
    // }

    function followit(){
        if(props){
            props.savemyfollow(tit);
        }
    }
   
    return(
        <div className={style.recentcard}>
            <div className={styles.card}>
                <div className={styles.card__inner} style={myStyle}>
                </div>

                <main className={styles.card__body}>
                    <div className={styles.card__info}>
                        <h1 className={styles.card__title}>{props.item ? ((props.item.title_english) ? props.item.title_english : props.item.title) : "Title"}</h1>
                        <button onClick={() => {followit()}} className={styles.card__btn2} value="follow" >Follow</button>
                        <a href={props.item ? (props.item.trailer.url): "#"} target="_blank">
                            <button className={styles.card__btn} value="Watch trailer" >Watch trailer</button>
                        </a>

                        <div className={styles.card__rating}>
                            <strong>Broadcast  </strong>  : {props.item ? (props.item.broadcast.string) : "Not found"} (3:30 hrs ahead of IST)
                        </div>
                        <div className={styles.card__rating}>
                            <strong>Current Episode  </strong>  : {props.item ? (props.item.episodes) : "not found"} 
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