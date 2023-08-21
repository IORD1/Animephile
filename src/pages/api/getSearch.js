
export default async function getSearch(req, res) {

    const param = req.body
    const response = await fetch(`https://api.jikan.moe/v4/anime/?letter=naruto`).then(
        (res) => res.json()
    );  
    res.status(200).json(response)
}