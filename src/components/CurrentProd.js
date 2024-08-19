import React, { useState, useEffect } from "react";

const CurrentData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [pumper, setPumper] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    fetchData();
  }, [date, pumper, tag]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://beta.ogpumper.net/api/currentprod.php?date=${date}&pumper=${pumper}&tag=${tag}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (e) {
      setError(`An error occurred: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Current Data</h1>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="text"
        value={pumper}
        onChange={(e) => setPumper(e.target.value)}
        placeholder="Pumper"
      />
      <input
        type="text"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="Tag"
      />
      <table>
        <thead>
          <tr>
            <th>Lease Name</th>
            <th>Oil</th>
            <th>Water</th>
            <th>Gas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.PrintLeaseID}>
              <td>{item.PrintLeaseName}</td>
              <td>{item.Produced}</td>
              <td>{item.WaterTotal}</td>
              <td>{item.Gas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrentData;
