import styles from "@/styles/Home.module.scss"

export default  function Newscard(props){
    const url = props.item.images.jpg.image_url
    const myStyle = {
        background: `url(${url})`,
        backgroundSize: 'cover'
    }
    return(
        <>
        <div className={styles.newbox}>
            <div className={styles.newscard} style={myStyle}>
            </div>
            <div className={styles.newstextbox}>
                <p className={styles.newheader}>{props.item.title_english}</p>
                <div className={styles.newtext}>
                    <p>{props.item.synopsis.slice(0,500)}</p>
                </div>

            </div>
        </div>
        </>
    )
}