import { useRoutes } from 'react-router-dom';
import routes from "./routes";
import { ThemeProvider } from "@providers/theme-provider";
import { CursorProvider } from "@providers/cursor-provider";

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
