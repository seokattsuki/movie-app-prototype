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
      console.log("Fetched movies data:", data);

      // TMDb API doesn't return "response" field like OMDB
      // Check if we have results
      if (data.results) {
        setMovieList(data.results);
        
        // Update search count if it's a search query and has results
        if (query && data.results.length > 0) {
          console.log("Updating search count for:", query, data.results[0]);
          await updateSearchCount(query, data.results[0])
          // Reload trending movies after updating search count
          loadTrendingMovies();
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
      console.log("Loading trending movies...");
      const movies = await getTrendingMovies();
      console.log("Trending movies received:", movies);

      setTrendingMovies(movies || []);
    } catch (error) {
      console.error("Error fetching trending movies: ", error)
    }
  }

  // Use debouncedSearchTerm instead of searchTerm for API calls
  useEffect(() => {
    fetchmovies(debouncedSearchTerm);
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  // Debug: Log trending movies state
  useEffect(() => {
    console.log("Trending movies state updated:", trendingMovies);
  }, [trendingMovies]);

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

        {/* Debug: Show trending movies count */}
        <div style={{color: 'white', margin: '10px 0'}}>
          Debug: Trending movies count: {trendingMovies.length}
        </div>

        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id || movie.id}>
                  <p>{index+1}</p>
                  <img 
                    src={movie.poster_url || '/no-movie.png'} 
                    alt={movie.title || movie.movieTitle}
                    onError={(e) => {
                      console.log("Image failed to load:", movie.poster_url);
                      e.target.src = '/no-movie.png';
                    }}
                  />
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