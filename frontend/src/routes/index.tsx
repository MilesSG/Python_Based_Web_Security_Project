import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import Statistics from '../pages/Statistics';
import SqlInjection from '../pages/vulnerabilities/SqlInjection';
import XssAttack from '../pages/vulnerabilities/XssAttack';
import FileUpload from '../pages/vulnerabilities/FileUpload';
import InsecureReference from '../pages/vulnerabilities/InsecureReference';
import Protection from '../pages/Protection';
import Visualization3D from '../pages/Visualization3D';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'statistics',
        element: <Statistics />,
      },
      {
        path: 'vulnerabilities',
        children: [
          {
            index: true,
            element: <Navigate to="/vulnerabilities/sql-injection" replace />,
          },
          {
            path: 'sql-injection',
            element: <SqlInjection />,
          },
          {
            path: 'xss-attack',
            element: <XssAttack />,
          },
          {
            path: 'file-upload',
            element: <FileUpload />,
          },
          {
            path: 'insecure-reference',
            element: <InsecureReference />,
          },
        ],
      },
      {
        path: 'protection',
        element: <Protection />,
      },
      {
        path: 'visualization',
        element: <Visualization3D />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

export default router; 