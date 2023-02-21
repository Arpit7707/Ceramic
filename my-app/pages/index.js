import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { Web3Provider } from "@ethersproject/providers";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { useViewerConnection } from "@self.id/react";
import { EthereumAuthProvider } from "@self.id/web";
import { useViewerRecord } from "@self.id/react";

function Home() {
  //hook used to easily connect and disconnect to ceramic network
  const [connection, connect, disconnect] = useViewerConnection();

  const web3ModalRef = useRef();

  const connectToSelfID = async () => {
    const ethereumAuthProvider = await getEthereumAutProvider();
    //connecting to ceramic network
    connect(ethereumAuthProvider);
  };

  //returns an instance of EthereumAuthProvider
  // You may be wondering why we are passing it wrappedProvider.provider instead of wrappedProvider directly. It's because ethers
  //abstracts away the low level provider calls with helper functions so it's easier for developers to use, but since not everyone
  //uses ethers.js, Self.ID maintains a generic interface to actual provider specification, instead of the ethers wrapped version.
  //We can access the actual provider instance through the provider property on wrappedProvider. connectToSelfID takes this
  //Ethereum Auth Provider, and calls the connect function that we got from the useViewerConnection hook which takes care of
  //everything else for us.
  const getEthereumAutProvider = async () => {
    const wrappedProvider = await getProvider();
    const signer = wrappedProvider.getSigner();
    const address = await signer.getAddress();
    return new EthereumAuthProvider(wrappedProvider.provider, address);
  };

  const getProvider = async () => {
    const provider = await web3ModalRef.current.connect();
    const wrappedProvider = new Web3Provider(provider);
    return wrappedProvider;
  };

  useEffect(() => {
    if (connection.status !== "connected") {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
  }, [connection.status]);

  return (
    <div className={styles.main}>
      <div className={styles.navbar}>
        <span className={styles.title}>Ceramic Demo</span>
        {connection.status === "connected" ? (
          <span className={styles.subtitle}>Connected</span>
        ) : (
          <button
            onClick={connectToSelfID}
            className={styles.button}
            disabled={connection.status === "connecting"}
          >
            Connect
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.connection}>
          {connection.status === "connected" ? (
            <div>
              <span className={styles.subtitle}>
                Your 3ID is {connection.selfID.id}
              </span>
              <RecordSetter />
            </div>
          ) : (
            <span className={styles.subtitle}>
              Connect with your wallet to access your 3ID
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

//Component to store and retrieve user data from ceramic
function RecordSetter() {
  const [name, setName] = useState("");

  const record = useViewerRecord("basicProfile");

  console.log(record);
  //helper function to update name stored in our record(data on Ceramic)
  //It takes a parameter name and updates the record.
  const updateRecordName = async (name) => {
    await record.merge({ name: name });
  };

  return (
    <div className={styles.content}>
      <div className={styles.mt2}>
        {record.content ? (
          <div className={styles.flexCol}>
            <span className={styles.subtitle}>
              Hello {record.content.name}!
            </span>

            <span>
              The above name was loaded from Ceramic Network. Try updating it
              below.
            </span>
          </div>
        ) : (
          <span>
            You do not have a profile record attached to your 3ID. Create a
            basic profile by setting a name below.
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.mt2}
      />
      <button onClick={() => updateRecordName(name)}>Update</button>
    </div>
  );
}

export default Home;
