import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const LOCAL_STORAGE_KEY = "roamjs-flag";

const FeatureFlagContext = createContext<{
  flag?: boolean;
}>({});

const FeatureFlagProvider: React.FC = ({ children }) => {
  const [flag, setFlag] = useState(false);
  const keypressListener = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "KeyQ") {
        setFlag(!e.shiftKey);
        localStorage.setItem(LOCAL_STORAGE_KEY, `${!e.shiftKey}`);
        e.preventDefault();
      }
    },
    [setFlag]
  );
  useEffect(() => {
    document.addEventListener("keydown", keypressListener);
    return () => document.removeEventListener("keydown", keypressListener);
  }, [keypressListener]);
  useEffect(() => {
    setFlag(localStorage.getItem(LOCAL_STORAGE_KEY) === "true")
  }, [setFlag]);
  return (
    <FeatureFlagContext.Provider value={{ flag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFlag = (): boolean => useContext(FeatureFlagContext).flag;

export default FeatureFlagProvider;
