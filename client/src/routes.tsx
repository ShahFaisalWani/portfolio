import { Outlet } from 'react-router-dom';
import PageAppContent from 'src/AppContent';
import PageHome from '@pages/Home';
import AdminPage from '@pages/Admin';

const routes = [
  {
    path: '/',
    element: (
      <>
        <Outlet />
      </>
    ),
    children: [
      {
        path: '/',
        element: <PageAppContent />,
        children: [
          {
            path: '/',
            element: <PageHome />
          },
          {
            path: '/admin',
            element: <AdminPage />
          }
        ]
      }
    ]
  }
];

export default routes;
