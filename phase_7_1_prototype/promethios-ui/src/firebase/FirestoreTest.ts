import { doc, setDoc, getDoc } from "firebase/firestore";

export const runFirestoreTest = async (db: any, userId: string) => {
  console.log("FirestoreTest: Starting isolated Firestore test...");
  const testDocRef = doc(db, "testCollection", userId);

  try {
    // Test Write Operation
    const testData = { timestamp: new Date().toISOString(), message: "Hello from Firestore Test!" };
    console.log("FirestoreTest: Attempting to write data:", testData);
    await setDoc(testDocRef, testData);
    console.log("FirestoreTest: Write operation successful!");

    // Test Read Operation
    console.log("FirestoreTest: Attempting to read data...");
    const docSnap = await getDoc(testDocRef);

    if (docSnap.exists()) {
      console.log("FirestoreTest: Read operation successful! Data:", docSnap.data());
    } else {
      console.warn("FirestoreTest: Document does not exist after write operation.");
    }
  } catch (error: any) {
    console.error("FirestoreTest: Error during Firestore test:", error.code, error.message, error);
  }
  console.log("FirestoreTest: Isolated Firestore test finished.");
};


