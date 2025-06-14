import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { CMUBenchmarkFramework } from '../modules/cmu-benchmark/CMUBenchmarkFramework';
import { BenchmarkTestRunner } from '../modules/cmu-benchmark/BenchmarkTestRunner';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`benchmark-tabpanel-${index}`}
      aria-labelledby={`benchmark-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const CMUBenchmarkPage: React.FC = () => {
  console.log("CMUBenchmarkPage rendering...");
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAgentSelect = (agent: any) => {
    // Navigate to chat with selected agent
    console.log('Selected agent for chat:', agent);
    // This would typically navigate to the chat page with the agent pre-selected
  };

  const handleBenchmarkStart = () => {
    // Switch to benchmark test runner tab
    setTabValue(1);
  };

  return (
    <Box sx={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { color: '#ccc' },
            '& .Mui-selected': { color: 'white' },
            '& .MuiTabs-indicator': { backgroundColor: '#1976d2' }
          }}
        >
          <Tab label="Demo Agents" />
          <Tab label="Benchmark Test Runner" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <CMUBenchmarkFramework 
          onAgentSelect={handleAgentSelect}
          onBenchmarkStart={handleBenchmarkStart}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <BenchmarkTestRunner />
      </TabPanel>
    </Box>
  );
};

export default CMUBenchmarkPage;

