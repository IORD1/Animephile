import styles from "@/styles/Home.module.scss"

export default  function Newscard(props){
    let url = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Fpremium-vector%2Fmystical-child-anime-error-404-page-found_30246586.htm&psig=AOvVaw1rzZhpqlKmQhUp3NTEjkzf&ust=1692862576262000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCOjvi9ai8oADFQAAAAAdAAAAABAE";
    let myStyle = {
        background: `url(${url})`,
        backgroundSize: 'cover'
    }
    let synop = "Synopsis not found";
    let engtitle = "Title not found";

    if(props.item){
         url = props.item.images.jpg.image_url
         synop = props.item.synopsis.slice(0,500);
         engtitle = props.item.title_english;
    }
    return(
        <>
        <div className={styles.newbox}>
            <div className={styles.newscard} style={myStyle}>
            </div>
            <div className={styles.newstextbox}>
                <p className={styles.newheader}>{engtitle}</p>
                <div className={styles.newtext}>
                    <p>{synop}</p>
                </div>

            </div>
        </div>
        </>
    )
}