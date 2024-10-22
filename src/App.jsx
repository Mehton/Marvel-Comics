import React, { useEffect, useState } from "react";
const API_KEY = import.meta.env.VITE_APP_API_KEY;
const PRIVATE_API_KEY = import.meta.env.VITE_SERVER_API_KEY;
import "./App.css";
import md5 from "crypto-js/md5";

const ComicsList = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [selectedComicType, setSelectedComicType] = useState(""); // New filter
  const [totalComics, setTotalComics] = useState(0);
  const [averageComicsPerCharacter, setAverageComicsPerCharacter] = useState(0);
  const [medianComicsPerCharacter, setMedianComicsPerCharacter] = useState(0);
  const [modeComicsPerCharacter, setModeComicsPerCharacter] = useState(0);
  const publicKey = API_KEY;
  const privateKey = PRIVATE_API_KEY;

  useEffect(() => {
    const fetchComics = async () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const hash = md5(timestamp + privateKey + publicKey).toString();
      const url = `https://gateway.marvel.com:443/v1/public/comics?apikey=${publicKey}&ts=${timestamp}&hash=${hash}&limit=100`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 200) {
          const comicsData = data.data.results;
          setComics(comicsData);
          setTotalComics(comicsData.length);
          setAverageComicsPerCharacter(
            comicsData.reduce(
              (acc, comic) => acc + comic.characters.available,
              0
            ) / comicsData.length
          );
          setMedianComicsPerCharacter(
            calculateMedian(
              comicsData.map((comic) => comic.characters.available)
            )
          );
          setModeComicsPerCharacter(
            calculateMode(comicsData.map((comic) => comic.characters.available))
          );
        } else {
          console.error("Error fetching comics:", data.status);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComics();
  }, []);

  const calculateMedian = (numbers) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const calculateMode = (numbers) => {
    const frequency = {};
    numbers.forEach((num) => (frequency[num] = (frequency[num] || 0) + 1));
    const maxFreq = Math.max(...Object.values(frequency));
    const modes = Object.keys(frequency).filter(
      (num) => frequency[num] === maxFreq
    );
    return modes.length === 1 ? modes[0] : modes; // Return as array if multiple modes
  };

  const filteredComics = comics.filter((comic) => {
    return (
      comic.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCharacter
        ? comic.characters.items.some(
            (character) => character.name === selectedCharacter
          )
        : true) &&
      (selectedComicType ? comic.type === selectedComicType : true)
    );
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Marvel Comics</h1>
      </header>

      <nav className="navbar">
        <ul>
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#comics">Comics</a>
          </li>
          <li>
            <a href="#favorites">Favorites</a>
          </li>
        </ul>
      </nav>

      <div className="stats">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="card">
              <h2>Total Comics: {totalComics}</h2>
              <h3>
                Average Comics per Character:{" "}
                {averageComicsPerCharacter.toFixed(2)}
              </h3>
              <h3>Median Comics per Character: {medianComicsPerCharacter}</h3>
              <h3>
                Mode Comics per Character:{" "}
                {Array.isArray(modeComicsPerCharacter)
                  ? modeComicsPerCharacter.join(", ")
                  : modeComicsPerCharacter}
              </h3>
            </div>

            <div className="filters">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title..."
              />

              <select onChange={(e) => setSelectedCharacter(e.target.value)}>
                <option value="">Select Character</option>
                {comics.flatMap((comic) =>
                  comic.characters.items.map((character) => (
                    <option
                      key={`${character.id}-${comic.id}`}
                      value={character.name}
                    >
                      {character.name}
                    </option>
                  ))
                )}
              </select>

              {/* New Comic Type Filter */}
              <select onChange={(e) => setSelectedComicType(e.target.value)}>
                <option value="">Select Comic Type</option>
                <option value="comic">Comic</option>
                <option value="graphic novel">Graphic Novel</option>
                <option value="trade paperback">Trade Paperback</option>
                {/* Add more options as needed */}
              </select>
            </div>

            <div className="comics-list">
              {filteredComics.map((comic) => (
                <div className="comic-card" key={comic.id}>
                  <h3>{comic.title}</h3>
                  <img
                    src={`${comic.thumbnail.path}.${comic.thumbnail.extension}`}
                    alt={comic.title}
                    className="comic-image"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComicsList;
