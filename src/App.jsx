import Search from './components/Search.jsx'
import { useState, useEffect } from 'react'


const API_BASE_URL ="https://api.themoviedb.org/3"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  METHOD: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
}


const App = () => {

  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [loading, setLoading] = useState(false);

const fetchmovies = async () => {

  setLoading(true);
  setErrorMessage("");

  try {
    const endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
    const response = await fetch(endpoint, API_OPTIONS)

    if(!response.ok){
      throw new Error("Failed to fetch movies")
    }

    const data = await response.json();
    console.log(data);

    if(data.response === "False"){
       setErrorMessage(data.error)
       setMovieList([])
    }

    setMovieList(data.results || [])
  } catch (error) {
    console.error("Error etching movies: ", error)
    setErrorMessage("Failed to fetch movies, try again later.")
  } finally  {
    setLoading(false);
  }
}

useEffect(() => {
  fetchmovies();
}, [])


  return(
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner"/>
        <h1>Find <span className="text-gradient">Movies</span>
        You'll Enjoy Without the Hassle</h1>

        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        <section className="all-movies">
          <h2>All movies</h2>

          {loading ? (<p className='text-white'>Loading...</p>) : errorMessage ? <p className="text-red-500">{errorMessage}</p> : 
          <ul>
            {movieList.map((movie) => (
              <p className='text-white'>{movie.title}</p>
            ))}
            </ul>
          }

          {errorMessage && <p className="text-red-500">errorMessage</p>}
        </section>
      </div>
    </main>
  )
}

export default App;