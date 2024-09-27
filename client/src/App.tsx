import { useRoutes } from 'react-router-dom';
import routes from "./routes";
import { ThemeProvider } from "@providers/theme-provider";
import { CursorProvider } from "@providers/cursor-provider";
import ReactGA from 'react-ga4';

ReactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);

const App = () => {
  const routing = useRoutes(routes);

  return (
    <ThemeProvider>
      <CursorProvider>
        {routing}
      </CursorProvider>
    </ThemeProvider>
  )
};

export default App;
