import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transferAmount, setTransferAmount] = useState("0.01");
  const [recipient, setRecipient] = useState("");
  const [notification, setNotification] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [depositAmount, setDepositAmount] = useState("1000");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with actual address
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(new ethers.providers.Web3Provider(window.ethereum));
    }
  };

  const handleAccount = async () => {
    if (ethWallet) {
      const accounts = await ethWallet.listAccounts();
      if (accounts.length > 0) {
        console.log("Account connected: ", accounts[0]);
        setAccount(accounts[0]);
        getATMContract();
      } else {
        console.log("No account found");
      }
    }
  };

  const connectAccount = async () => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      handleAccount();
    } catch (error) {
      console.error("Error connecting account:", error);
    }
  };

  const getATMContract = async () => {
    const network = await ethWallet.getNetwork();
    console.log("Network:", network);
    if (network.chainId === 1337 || network.chainId === 31337) {
      // Localhost or Hardhat network
      const signer = ethWallet.getSigner();
      const atmContract = new ethers.Contract(contractAddress, atmABI, signer);
      setATM(atmContract);
    } else {
      console.error("Unsupported network");
    }
  };

  const getBalance = async () => {
    if (atm) {
      const balance = await atm.getBalance();
      setBalance(balance.toNumber());
      console.log("Balance fetched: ", balance.toNumber());
    }
  };

  const executeTransaction = async (transaction) => {
    try {
      const receipt = await transaction.wait();
      console.log("Transaction hash:", receipt.transactionHash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Block number:", receipt.blockNumber);
      console.log("Confirmations:", receipt.confirmations);
      getBalance();
      // Add transaction to history
      setTransactionHistory([...transactionHistory, receipt]);
    } catch (error) {
      console.error("Transaction error:", error);
    }
  };

  const deposit = async () => {
    if (atm && depositAmount !== "") {
      const tx = await atm.deposit(parseInt(depositAmount));
      executeTransaction(tx);
    }
  };

  const withdraw = async () => {
    if (atm && withdrawAmount !== "") {
      const tx = await atm.withdraw(parseInt(withdrawAmount));
      executeTransaction(tx);
    }
  };

  const transfer = async (amount, recipient) => {
    const signer = ethWallet.getSigner();
    try {
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.utils.parseEther(amount),
      });
      const receipt = await tx.wait();
      console.log("Transaction hash:", receipt.transactionHash);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Block number:", receipt.blockNumber);
      console.log("Confirmations:", receipt.confirmations);
      getBalance();
      setNotification(`Transfer of ${amount} ETH to ${recipient} successful.`);
    } catch (error) {
      console.error("Error transferring ETH:", error);
      setNotification("Error transferring. Please try again.");
    }
  };

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  const toggleTransactionHistoryVisibility = () => {
    setShowTransactionHistory(!showTransactionHistory);
  };

  const showTransaction = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    if (!account) {
      return <button onClick={connectAccount}>Please connect your Metamask wallet</button>;
    }

    if (showBalance && balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        {showBalance && <p>Your Balance: {balance}</p>}
        <input
          type="number"
          placeholder="Enter withdrawal amount"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />
        <button onClick={withdraw}>Withdraw</button>
        <input
          type="number"
          placeholder="Enter deposit amount"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <button onClick={deposit}>Deposit</button>
        <button onClick={toggleBalanceVisibility}>
          {showBalance ? "Hide Balance" : "Show Balance"}
        </button>
        <button onClick={toggleTransactionHistoryVisibility}>
          {showTransactionHistory ? "Hide Transaction History" : "Show Transaction History"}
        </button>
        {showTransactionHistory && (
          <>
            <h2>Transaction Receipt</h2>
            <ul>
              {transactionHistory.map((tx, index) => (
                <li key={index} onClick={() => showTransaction(tx)}>
                  Transaction Hash: {tx.transactionHash}
                </li>
              ))}
            </ul>
          </>
        )}
        <div>
          <h2>Transfer ETH</h2>
          <input
            type="range"
            min="0.01"
            max="10"
            step="0.01"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />
          <p>Transfer Amount: {transferAmount} ETH</p>
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <button onClick={() => transfer(transferAmount, recipient)}>Transfer</button>
          {notification && <p>{notification}</p>}
        </div>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>WELCOME TO PRIYANSH BANK ACCOUNT</h1>
      </header>
      {initUser()}
      {selectedTransaction && (
        <div>
          <h3>Transaction Details</h3>
          <p>Transaction Hash: {selectedTransaction.transactionHash}</p>
          {/* Add more details if needed */}
          <button onClick={() => setSelectedTransaction(null)}>Close</button>
        </div>
      )}
      <style jsx>{`
        .container {
          text-align: center;
          background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw0PDRANDQ8SDQ8OEBAQDg0NDhAPEA8PFxIWFhYRFRUYHSgiGBolHRcVITEhKCkrLi46FyAzODMsOCguLysBCgoKDg0OGxAQGi0mICUtLS0rLS0tLSstNSsrLS0tLSsrLS0tLS0tLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIALcBEwMBEQACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAQYEBQcDAv/EADkQAAIBAgQEAwYEBQQDAAAAAAECAAMRBAUSUQYhMUETYXEiMkJSgbFikaHwFILBwtEVFiNyM0NT/8QAGwEBAQADAQEBAAAAAAAAAAAAAAEDBAUCBgf/xAAwEQEAAgEDAgIJBAMBAQAAAAAAAQIDBBESITEFQRMiMlFhcYGx0ZGhweEUI/BCFf/aAAwDAQACEQMRAD8A6xN1okJJCIgICERAQhAQEqEBCIhCAgIEQhAQEqEBAiBSeLs/WoDhaB1JceLUHRiDfQvlccz3t+e/pcExPO30crW6qJj0dfqqc6DnV7rZw7woHQVsYDZhdKNypI+ZyOY9JoZ9ZMTxx/q6en0kTG+T9GRnvB9MoXwY0OoJNIszK48ibkH9PSTBrbRO1+sPWfR1470U6nh+d2526DtOhOXeNocm2Tfs9DPMMTFxFb4R9TNjHTzlnx085Yk2WeHwZ7hXyZ7h7gFNjzAjlCbw71PiH0hKEJsQiICAhEQEIQEBKhAQiIQgICBEIQEBKhA1vEXifwVfwr6tHbrpuNVv5dU94tucbsGo5eitx7uXmdmHzy4cK8NW04nErsaVFh02dh9hNDU6nf1KdvOXW0mk29e/0hcJpOjLGzDHU8PTNWoeQ91e7t2UT1Wk3naGHNmrirys5mxuST358p14jaHze+8zLDxNa3Jevc7Tax4/OWWlPOWGZtQzPkyvUPgz3CvSjRvzPTsN55vfbpBNvJ7mYmGXbZ8k+sICUISYIREBAQiICEICCSVCAhEQhAQECIRECYGo4nzVsLh9dMA1HYIhIuFNiSxHfkP1mfT4oyX2ns1tVmnFTeO6hUOMsdRqh6lQ16d/+SkyrzXvpIA0nbtO3HhuHJTaI2nyn8tTDqbzPrTu6HTyfBaxWWgmo2YHTyv1B09L/ScGcmTbjMt70GPflxjdsZ4ZWLmGNp0KZqVDYDoB7zN8oG89VrNp2hizZq4q8rKDmmYVMRU8SpyA5Ig91F2Hnue86OPHFI2h87qM9s1uVmoxVQgWHfv5TbxV3nd5xV36sEzbhsPkzJCw+TK9Q+6VG/M9Ow3nm19ukPNr7dmRMbxV8Genp26fJPqkQEBKEJsQiICAhEQEIQEBKhAQiIQgICBEIQNdnmVri6BpE6CCGR7X0sL9R3HMiZcOWcduUMOfDGWnGVPwvAFZqw/ialPwQbsKRZnqD5eYGm+86s+KxWkxSJ3+Pl+Wti0k1ne0ugCcZvMfH42nQpmpUNgOQA95m+UectazadoYs2auKvKyhZnmFTEVDUqcgLhEHuouw89z3nQx0ikbQ+czZ7ZrcrfR4YXC1KzrSpjUzfkB3JPYT3a0VjeUx4rZLRWreZ3wvSTAsym9agrVWqfOALstuwsOXp5mYtPqreljftPR2J0VMeLp3jruoZnahz3yZkhYelGjfmenYbzHa/lDza+3SHu08QxPmemSj5nt6dtnyL6ogRAQEoQkkIiAgIREBCEBBJKhAQiIQgICBEIQIgY+PxtOhTNSobAdAOrHsoG89VrNp2hhz5qYacrKJmeYVMRU1vyAuEQdEXYee5m9SkUjZ8zm1Fs9+VvpDwwmGqVXFOmNTNf0A7knsJ7taKxvJhx2yW41XvJ8qp4anpHtO1vEqW5sdhsBtNDJkm87y+j0+nrhrtHfzlXuNOIFVHwdE6nYaazjoi90H4j0O3r03dFpptMZLdvJh1WoiI4V7qGZ2Ycx60aN+Z6dhvPN77dIebX26Pd5ihjl5tMkEPkGemSr5M9PTt0+SfVEBAiAgJQhNiERAQEIiAhCAgJUICERCEBAQIhCBQM7xr1qzFjyUsqL2VQfue83cVYrD5TWZ7Zcs7+XSGJhMM9WoKdMamb8gNyewmS1orG8sWDFbJfjXuveUZXTw1PSvtO3/kqW5sdhsPKaV7zed5fTabTVwV2jv5yzxPEtlxrGIy1XVzdldgx3bUbmfSYpiaxMe5wLe1L6wmFaoygKWLEBUHMsZMmWKwxzMzPGvd0LJeGaNJA2IRa1U9QwDIn4QDyPrONm1Nrz6s7Q6un0VKV3vG8vjN+E6FYhqBGHbuFW6N/LcaT6flLh1l6dLdUzaKl+tej6ybhuhhb1azLVcdHcBUp+gJ6+f2jNqr5fViNoXDpaYfWtO7OzPKcNjEGsA/JWpFdQ9G7jymLFmyYbdP0lnvipkhpf9jYf/wC1X8k/xNz/AOlk90fv+Wv/AINPfK6Tku1MIlQhCBEBAShCSQiICAhEQEIQEBKhAQiIQgICERA0OZcNpVqGoj+EWN2UrqF+5HMWmamWaxs5mo8MpkvyrO27YZVllPDKVT2mb36h6t5eQ8p4vebTvLa02lpgrtXv5yzp5bCIFVznhV6lVqtBks5LMlS40seZsQDyvNzFquNdrOXn0FrXm1J7tlkGQphQXYipWbkXA5KPlX/MxZs85J+DZ02krhjfvLcTA20QiqcW1GL6T7qgWHbn3/e06mgrG275rxLJedTwntERt+Wm4JxVVcw8FSTTqo5qL8IKi4f1vYfzTc8Tx1nBF57xMOl4fM9nRJ8+6TImNvPGpiqSsEaoiueiM6hj6Am5nqK2mN4h4m1d9t3rIpCECICAlCEmCERAQEIiAhCAgJUICERCEBAQIhCAgJUICAgRAwsxyyliBaoCCOQZDZgNpmxZ74p3q1s+kx5+to6+95ZTkuHwuo0lOt+TVHOpyNtgPICes+pyZtuc9nrDhrijarYzXZX1jqjJRqugu6U3ZBuwUkD854rG8w2slprSZr32cUzBy5ZnJZmJLM3MsdyZ9XpYisbQ+ZpabTvPd0jgrM2/0pK2Kc2ptURajcyyKbL6nqv8s4niWGtdVNcce6dv+/V3seaKYOeSezFxHFWILk01REv7KsuokfiN/tMcaau3VwsnjOWb+pERCzZTjxiKIqgaTcqy9bMP2D9Zq3rxts7uk1EajFF4+vzZk8tlEBAShCTBCIgICERAQhAQbEqEBCIhCAgIEQhAQEqEBAQIgRCEI0dLi+kXs1JkS/v6gxA3K2+xMzzo7RHdo18bxzbaazEe/wDpjZhkOTOTiGqaVPtGnRrAKx2CjmPQW+kyYtXqaRwr9mfJXRRHpZtG3wn+GmzHH+Lpp01FKhSGmjRXoo3O5mWlJje1p3me8uBrNZbUW27VjtDHw1B6jinTGpmNgB++QlvaKxvLVxYrZbxWkbzLoGT4D+HoClfU1yzsOhY9beXQfSc69uVt32Wj03+Piinn5/Nmzw2SBEBAShCbEIiAgIREBCEBASoQECIeSAgIEQhAQEqEBAQIgIHMROvL4pMkj2w1B6jinTUszGwA/fSY7Wisby94sVstopSOsr5kuUJhk7NUYe3U/tHl95zcmWby+w0Oippq++3nLZTG3dkSoQhAiAgJQhJghEQEBCIgIQgINiVCAhEQhAQEIiAgICVCAgIEQOYideXxUvSjSZ2VEF2Zgqjck2E8WmIjeXvHSb2ite8r/kmUJhk+aqw9up/avl9/ty8uWck/B9hotDXTU99p7y2cxt1EBBKJUIQgRAQEoQkkIiAgIREBCEBASoQEIiEICAgRCEBASoQEBA5gJ15fFSysuxPg1qdW19DAkbjvb6TFkryrNWfTZvQ5a5Pc6RQrLURaiG6uAyncGcmY2naX3FL1vWLV7S+4ekwiIUhJRKhCECICAlCEmCERAQEIiAhCAgJUICERCEBAQIhCAgJUICBzATry+KetCi9RgiAszGyqOpM8WtFY3l7x47ZLRWsbzLoeDprhcKoquFWil6jk+yOdz+pnJtM3v08322nxxp8Fa2ntHVW6nHiCpZMOWpXtrNTS5G+m1vpebseH22626tG3i1Yt0r0WrBYunWpJWpHUji6n9CD5g3H0mjas1njLp471yVi1e0siR6RAQIlQhCBEBAShCTBCIgICERAQhAQSSoQEIiEICAgRCEBASoQOYTry+KW3hAUaeHrYmoVUqxVnb4KYVT+pJ9bCc/VcrXisPpPBK464rZZ777b/AAVniXiJ8Y+hLph0PsJ0Ln52/oO039NpYxRvPdj1esnNbjHstLTRmIVQWZjZVUXJJ6ACbFpiOstCKzbpDqvDeAfDYOnRqe+NTOBzClmJ0/S9pws+SMmSbQ+o0mKcWGKT3bOYmwmERAQSiVCEIEQEBKEJMEIiAgIREBCEBASoQEIiEICAgRCEBAQOYEgC55ATs7by+KiJmdoa/EYxmBQEimSCVubMRexI79T+cz0xRXrPdvY6zSvHfv3edJGZgqgszEBVUXJJ6ADeW0xEbyyViZttDo/CvDYwqitWAbEMPUUQfhH4tz9B58XU6mck7R2+7v6PRRhjlb2vssc1HQIESomERAQIlQhCBEBAShCSQiICAhEQEIQEBKhAQiIQgICBEIQEDj2IxJc2HJR08/Mz6OmOK9Z7vmcWPh83lSRmYKoLMxAVVFySTyAEtpiI3l7is2naHSuFOGlwqitWAbEMPUUQfhH4tz9B58PVaqcs8a+z930Gj0UYY5W9r7LET3PK002/MxEby1f+4sD4gpGuoYmwLBghP/ci36za/wAPPx5cejTpr9Pe3Gtm1mq3CBEqJhEQpCIlQhCBEBAShCTBCIgICERAQhAQEqEBCIhCAgIEQhA4vRRmYKoLMxAVVFySegA3n09piI3l89WJmdodL4T4ZXCqK1YBsQw9RRB+EbtufoO5PA1ernLPGvs/d39HooxRyt7X2WWabea/OLthqvhnUQOek35XFx+V5n08xGSN3N8Wi9tJeMff4e7fr+zludd59VpnzGj8nUsgSquCwy17+KtCmH1e8G0jkfPefK6mazmvNO287fq+2xxMUjdnzA9kCJUTCIgIJhEqEIQIgICUISSERAQEIiAhCAgJUICERCEDW5xndDC2FS7O3MU0sWtubnkJkx4rX7NfPqaYfa7+58ZPntDFEql0dRco9rkbgjrLkxWp3ecGqpm6R3bSYmy0PCPDIwqivXAbEMOnUUQfhH4tz9BudnV6uc08a+z900ejjFHK3tfZZibczyA6kzRb7nvFnFBrk4bDMRRHJ6i8jVOwPyff069bSaTj6946+5wtbruc8Mc9POf+8miyXGVKFenUpEg61BUdKik2KEd7zaz463pMS5+ny2x5ImvvdT/0rCip4ooU9YNw+hbg7jY+c4vp8k14zadvdu+lrpsNbcorET8mXMTMQEBAiVNkwiICDZEqEIQIgICUISYIREBAQiICEICAlQgIRpuIc9TCJYWes49in2A+dvL7/mRmw4ZyT8GpqtVGCPj7nO8RXeo7VKjF3c3Zj1JnTrWKxtD5+95vblaerecF4So+LWqARTpBtbdrlSAvrzv9Jraq0RTj5t3w/FacvLyh0Cc93XzhswoVaQrU6qNTIvr1AAf9r+6fIzzbHas8Zjq2q5aWryieii8XcUePfDYZrURyqVB/7jsPwff069XSaPh69+/lDi67Xc/9ePt5z7/6VUHnN+XK8174P4YKacVils/JqNFvg2dh82w7evTk6vVcvUp285dvQaHj/syd/KPyuU57rIhCB8LVQsVDKWHVQwJH0nrjO2+zzF6zO0T1fc8vTRZ7nXh3o0T/AMnxv1CeQ/F9pvaXS8/Wv2+7h+J+Keh/1Yp9bzn3f20uDzWvTcOajOL+0rsWBHcc+k3cumx2rtEbPn9P4nqMWSLTaZjzieq7AzivuonchXy7AAsxAAFySbADcyw82mKxMz2hoavE9MPZabMl/f1aSfMLb72m3XSWmOsuFk8cx1vtWszHv/DdYXEJVRaiG6sOX9QfOatqzWdpdjDmpmpF6dpesjIiAgJQhJghEQEBCIgIQgautxDgkfQ9YKb21FW0A+bWt9ek2a6PPavKK/8AfJqRrsFrcYt/3zbQG/Mcx2I7zWbTT8RZ6mESws9Zx7FPYfO3l9/zIz4cM5J+DV1Oqrhj4uc4jEPUdqlRi7sbsx6kzq1rFY2h8/e03tytPVn5Fk9TF1NK+zTW3iVbclGw3aYs2aMcfFm02lnNb4ebpGDwtOjTWlSXSi9BvuSe585yptNp3l9BSlaV41jo9pHpxQAbT6iXzkPoTxLyvvB/C2nTi8Uvtcmo0WHubO4+bYduvXpx9Xq+XqU7ecu3odDx/wBmSOvlH8rnOa65KEIqXE3EgBbDYdrNzFWqD7v4FO+57evTpaPS1na+T6R/MuH4j4htE4sXfzn+IVei5UhlJUqbgqbEHcTsWrFo2mOj5uLWrPKJ2lu/9x4tk0alBtYuEAc/0H0E0f8ABxRbf9m/bxfUzTjvHz26tck2ZjZx7Tv1ltsgwa1q1n91F1sPmsQLfrNPV5Zx06efRv8AhWkrqM+1u0dZXOcd9xsh3ABZiAALkk2AG5iOrzMxWN5U3PM5Nc+HTuKIPoah3PlsPr6dLBg4dbd3yfiXiU6ieFPYj9/6au17AcyeQA7mbO7kWiZ2iF2yPCvSw6o/JiSxHy37TlZ7xe8zD7Tw3T3waeK3792wmJvNJmWaEnw6JsB7zjv5A7ec2sWHzs4eu8R3nhin5z/Efl5ZfjKiuoLFlYgEMSeptcXnvLjrNd2vo9XkrkiJmZiZ26/Fv5pPpCUITYhEQEBCIgY+YKxo1AvUqbW6+k949ucbtTXVvOnvFO+zl+dd59TpnyukWjBZy2ByvDJV9rEtTPh0m+CmWbQX2AXSLeVt7cXPijNqbzT2d+/3/d9Lk1MYMUb+0p2IxD1HapUYu7m7MepM3K0isbQ4d7ze02t3bDIcmqYuppHs01t4lW3ujYbsZhz5oxR8WfTaW2a3w85dKweEp0aa0qS6UXoNz3JPc+c5NrTad5fQUx1pXjXs9pFIHFVn08vnI7rtwHkNNx/G1hq0uRRpnoCOtQ7m/IDta+1uTr9TMT6Ov1/Dr+G6Ssx6W30/K+Tku0wHznBip4RxFMPfSVLjk2xPQHymT0WTjy4zswTqMUW4zaN/mz5jZlN4t4m06sLhW9rmKtZT7u6Id9z26denQ02m39e/0j8uJ4j4htvixz185/iFJE35cFm4f3RNnFM8erXy92Ukssfk9U7TzLFLOyzGNQqCovO3Jh8ynqJrZ8UZK8WbR6q2mzRkj6/JemdQuokBQLljyAG5nD267P0DnEV5T2UvPs6NdvDp3WiD6Godz5bD6+nS0+n4etbu+S8S8RnPPCns/f8ApqVm1LkQs3CmDRtVdhdkbQl/h5AlvXnNDV3npWH0XgmnpbfNbvE7R+Vkmk+ilX83zbVelSPs9HcfF+EeXn3++7gwf+rPnPEfEuW+LF285/iGtSbMuVDd5TgDyqvy7ov9xmnmy7+rDu+H6KemXJ9IbaazskBKEJMEIiAgaHifiFcKvh07PiGHJeopj5m/oJsafTzlneezT1WqjDG0e0plDiTHJU8Tx3fncpU9pD5aeg+lp0baTFMbbOTXWZa233bPEcUYZh4gwKfxHUPU0sqt83S5/T1mKumyx6vOeP1Z51eH2ox+sreJxD1XapVYu7m7M3Un99pt1pFY2hoXtN55W7s/IclqYuppW601t4lUjko2G7HaYs+eMUfHyZ9PpZzT07ecul4LCU6FNaVJdKL0HcnuSe5O849rTad5d2lK0rxrHR45tmtHC09dZiL8lRRd3OwH9ek9Y8Vsk7VecuauKN7MHKOJ8NianhLrp1D7q1QBr8gQTz8pky6bJjjeezFh1ePLO0dJ+LdTBu2XFVn1Evm47rZwjxRTwtM4fEBvD1FkqILlCeqkbcr8tz9OXrNHbJbnTu6Wh11cVeF+3ky+IeM1qJ4OCLLq5PXI0kLsg6g+fbtuMWn0MxPLJ+jJq/EotHHF9Z/CmjpOjLiz2bOln+NWl4K4hxTtpt7JIXpYMRqH5zXtpsUzy4s8a3PFeHLowBMktSX0vWefN5Z6zda1nuk8S8+T1TtPMsUttkeXeO5LG1NLF9zso/I85parP6Ou0d5dDwzQf5OTe3s17/h559nhxB8OldaIPoah3Ow2H7GHT4Ip61u7b8S8RnNPo8fSsfv/AE1dGizn2R0685s7uLaYju+2plTZuRjciYln5Vmj4YkqA6t7yE2uR0IPYzDlwxk+boaTxC+knpG8T3hmY/P3rL4aL4Sn3jq1Mw2vYWEx49LFZ3tO7Y1fjN89eFI4x59erApzYlzat/k2XAgVanMfAvW/mf8AE0s+b/zD6Dw3QxaIy5PpH8y3k1HeIREBAShCSQjQ8UZ+MIgRBqr1ASgI9lB01nf0mzptP6W3XtHdqarU+hr07z2c2q1ndi7kszElmY3JJ7mdmtYrG0ODa02nee751GXZ53k1GNjdl5VhDiMRToX0+I1i2y2uT62BmPNf0dJt7mXDScl4r73VcFhKdCmtKkulF6DuT3JPcnecG1ptPK3d9FSlaV41eGc5nTwlE1qgLcwqIOrub2W/boeflPeLFOS3GHjNlrirylzDMsxq4mqatU3Y8gB7qL2VR2E7eLFXHXargZctsluVmRw5h3q42gqcitRahN7WVCGP6D9Z41Noritv8nvTVtbLWIdVnD3d9//Z');
          background-size: cover;
          background-position: center;
          padding: 20px;
        }
      `}</style>
    </main>
  );
}

       
