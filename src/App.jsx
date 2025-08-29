import Search from './components/Search.jsx'
import { useState, useEffect } from 'react'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'

const API_BASE_URL = "https://api.themoviedb.org/3"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: "GET",
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);

  // Fixed typo: debuncedSearchTerm -> debouncedSearchTerm
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  const fetchmovies = async (query = '') => {
    setLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query 
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
      
      const response = await fetch(endpoint, API_OPTIONS)

      if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.status}`)
      }

      const data = await response.json();
      console.log(data);

      // TMDb API doesn't return "response" field like OMDB
      // Check if we have results
      if (data.results) {
        setMovieList(data.results);
        
        // Update search count if it's a search query and has results
        if (query && data.results.length > 0) {
          await updateSearchCount(query, data.results[0])
        }
      } else {
        setMovieList([]);
        setErrorMessage("No movies found");
      }

    } catch (error) {
      console.error("Error fetching movies: ", error)
      setErrorMessage("Failed to fetch movies, try again later.")
      setMovieList([]);
    } finally {
      setLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies || []);
    } catch (error) {
      console.error("Error fetching trending movies: ", error)
    }
  }



  // Use debouncedSearchTerm instead of searchTerm for API calls
  useEffect(() => {
    fetchmovies(debouncedSearchTerm);
  }, [debouncedSearchTerm])

  // Load popular movies on initial render
  useEffect(() => {
    fetchmovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          {/* Fixed image path - should start with / for public directory */}
          <img src="/hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span>
            You'll Enjoy Without the Hassle
          </h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt={movie.title}/>

                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All movies</h2>

          {loading ? (
            <LoadingSpinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App;