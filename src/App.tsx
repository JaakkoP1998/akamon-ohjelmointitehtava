import React,{useState,useEffect} from 'react';
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
import { faker } from '@faker-js/faker';

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

// Päivän tunnit
const labels = ['00:00', '01:00', '02:00', '03:00', '04:00', 
  '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
'13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
'22:00', '23:00'];

// Tänne sähködata
export const data = {
  labels,
  datasets: [
    {
      label: 'Hinnat snt/kWh',
      data: labels.map(() => faker.number.int({min:0, max: 10})),
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ],
};

// Pääapplikaatio
function App() {
  const [average, setAverage] = useState(0);
  const [cheapest, setCheapest] = useState(0);
  const [priciest, setPriciest] = useState(0);
  const [cheapestHour, setCheapestHour] = useState("");
  const [priciestHour, setPriciestHour] = useState("");

  // Haetaan data fecthilla
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data/spot-data.json");
        if (!response.ok) throw new Error("Jotain meni pieleen");

        const data = await response.json();
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
        const highestDay = data.find((item: Object) => item.price === highest);
        const lowestDay = data.find((item: Object) => item.price === lowest);

        // Formatoidaan aikaleima haluttuun muotoon.
        // Tässä ollaan käytetty apuna tekoälyä.
        const formatTime = (timestamp: string): string => {
          const date = new Date(timestamp);
          return date.toISOString().slice(11, 16); // Haetaan tunnit
        };

        setPriciestHour(formatTime(highestDay.timestamp));
        setCheapestHour(formatTime(lowestDay.timestamp));

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
    <Bar options={options} data={data} />
  </div>
  );
}

export default App