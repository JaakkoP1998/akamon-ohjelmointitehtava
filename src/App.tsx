import {useState,useEffect} from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
//import { faker } from '@faker-js/faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Kuvaajan asetukset
export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

// Pääapplikaatio
function App() {
  const [average, setAverage] = useState(0);
  const [cheapest, setCheapest] = useState(0);
  const [priciest, setPriciest] = useState(0);
  const [cheapestHour, setCheapestHour] = useState("");
  const [priciestHour, setPriciestHour] = useState("");
  // Tämä on vähän monimutkaisempi, että saadaan spottidata näkyviin.
  // Chartjs dokumentaation mukaan labels on array string -elementeistä, 
  // datasets on taas vähän monimutkaisempi tapaus...
  const [chartData, setChartData] = useState<{ labels: string[]; datasets: any[] } | null>(null);

  // Formatoidaan aikaleima haluttuun muotoon.
  // Tässä ollaan käytetty apuna tekoälyä.
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toISOString().slice(11, 16); // Haetaan tunnit
  };

  // Interface, niin säästytään päänsäryltä.
  // Helpoittaa Typescriptin tyyppimuunnoksia vähäisen.
  interface spotData {
    price: number;
    timestamp: string;
    unit: string;
    deliveryArea: string;
  }

  // Haetaan data fecthilla
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data/spot-data.json");
        if (!response.ok) throw new Error("Jotain meni pieleen");

        const data: spotData[] = await response.json();
        //Testaamista varten
        console.log(data);

        // Haetaan hinnat erikseen keskiarvoa varten.
        // Konversio EUR/MWh -> snt/kWh on että jaetaan kympillä.
        // Sähkön arvolisävero 6.3.2025 on 25,5%.
        const prices = data.map((item: { price: number; }) => item.price );
        // Lasketaan hintojen keskiarvo.
        const average = prices.reduce((sum: number, price: number ) => sum + price, 0) / prices.length;
        const highest = Math.max(...prices);
        const lowest = Math.min(...prices)
        //Konversiot tehdään vasta kun hinnat on löydetty
        setPriciest(highest * 0.1 * 1.255);
        setCheapest(lowest * 0.1 * 1.255);
        setAverage(average * 0.1 * 1.255);

        //Hintoja vastaavat päivät
        const highestDay = data.find(item  => item.price === highest);
        const lowestDay = data.find(item => item.price === lowest);

        // Jos jostain syystä ei löydetty päiviä, pidetään stringit tyjinä
        setPriciestHour(highestDay ? formatTime(highestDay.timestamp) : "");
        setCheapestHour(lowestDay ? formatTime(lowestDay.timestamp) : "");
    
        // Kerätään vain relavantti data taulukkoon
        // Tällä hetkellä datassa ajat ovat jo järjestyksessä,
        // joku sorttaus varmaan kannattaisi tehdä jos dataa ei olisi järjestetty.
        const dataForChart = data.map(item =>({
          time: formatTime(item.timestamp),
          price: (item.price * 0.1 * 1.255),
        }));
        //console.log(dataForChart.map(row => row.price)); 

        const labels = dataForChart.map(row => row.time);
        const chartPrices = dataForChart.map(row => row.price);

        // Luodaan chartjs data,
        // pitää pitää huoli että taulukkoa ei yritetä luoda ennen kun
        // tämä on paikoillaan.
        setChartData({
          labels,
          datasets: [
            {
              label: "snt/kWh",
              data: chartPrices,
              backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
          ],
        });
       
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);
  

  return (
  <div>
    <h1>Akamon - spottihinta ohjelmointitehtävä</h1>
    <div className="yhteenveto">
      <div className="harmaalaatikko">
          <p>Halvin tunti {cheapestHour}</p>
          <p>{cheapest.toFixed(2)} snt/kWh</p>
      </div>
      <div className="harmaalaatikko">
          <p>Kallein tunti {priciestHour}</p>
          <p>{priciest.toFixed(2)} snt/kWh</p>
      </div>
      <div className="harmaalaatikko">
        <p>Keskiarvo</p>
        <p>{average.toFixed(2)} snt/kWh</p>
      </div>
    </div>
    {chartData ? (
        <Bar
          data={chartData}
          options={options}
        />
      ) : (
        <p>Ladataan...</p>
      )}
  </div>
  );
}

export default App