import './App.css';
import React, { useState, useEffect } from "react";
import { Providers, ProviderState } from "@microsoft/mgt-element";
import {
  Divider,
  FluentProvider,
  Spinner,
  Tab,
  TabList,
  Text,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import { Map20Regular, People20Regular } from '@fluentui/react-icons';
import { ContainerSelector } from '../components/ContainerSelector';
import { IContainer } from '../../../common/schemas/ContainerSchemas';
import { CreateContainerButton } from '../components/CreateContainerButton';
import { ChatSidebar } from '../components/ChatSidebar';
import { Outlet, useOutletContext, useNavigate } from "react-router-dom";
import TopNavBar from '../components/TopNavBar';

type ContextType = {
  selectedContainer: IContainer | undefined,
  setSelectedContainer: React.Dispatch<React.SetStateAction<IContainer | undefined>>
};

export function useContainer() {
  return useOutletContext<ContextType>();
}

const useIsSignedIn = () => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  useEffect(() => {
    const updateIsSignedIn = () => {
      setIsSignedIn(Providers.globalProvider.state === ProviderState.SignedIn);
    }
    updateIsSignedIn();
    Providers.globalProvider.onStateChanged(updateIsSignedIn);
    return () => {
      Providers.globalProvider.removeStateChangedHandler(updateIsSignedIn);
    }
  }, []);
  return isSignedIn;
}

function App() {
  const [selectedContainer, setSelectedContainer] = useState<IContainer | null>(null);
  const isSignedIn = useIsSignedIn();
  const navigate = useNavigate();

  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [showNav, setShowNav] = useState<boolean>(false);
  const sidebarRef = React.useRef<HTMLDivElement | null>(null);
  const sidebarResizerRef = React.useRef(null);

  const handleLoginCompleted = () => {
    if (Providers.globalProvider.state === ProviderState.SignedIn) {
      navigate('/welcome');
    }
  };

  const onResizerMouseDown = (e: React.MouseEvent) => {
    if (!sidebarRef.current) return;
    const minSidebarWidth = 200;
    const maxSidebarWidth = 600;
    let prevX = e.clientX;
    let sidebarBounds = sidebarRef.current!.getBoundingClientRect();
    const onMouseMove = (e: MouseEvent) => {
      const newX = prevX - e.x;
      const newWidth = Math.max(minSidebarWidth, Math.min(maxSidebarWidth, sidebarBounds.width + newX));
      sidebarRef.current!.style.minWidth = `${newWidth}px`;
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  if (!isSignedIn) {
    return (
      <FluentProvider theme={webLightTheme}>
        <TopNavBar onLoginCompleted={handleLoginCompleted} />
        <div className="pre-signin-landing">
          <h2>Sign in to get started</h2>
          <p>Use the <strong>Sign In</strong> button in the navigation bar above to access the application.</p>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={webLightTheme}>
      <TopNavBar
        onChatToggle={() => setShowSidebar(s => !s)}
        onNavToggle={() => setShowNav(n => !n)}
      />
      <div className="App">
        <div className="spe-app-content">
          <div className={`spe-app-content-navigation${showNav ? '' : ' spe-app-content-navigation--hidden'}`}>
            <FluentProvider theme={webDarkTheme}>
              <div className="navigation-tabs">
                <TabList vertical={true} size='large'>
                  <Tab value="home" icon={<Map20Regular />} onClick={() => navigate('/welcome')}>Home</Tab>
                  <Tab value="containers" icon={<People20Regular />} onClick={() => navigate('/containers')}>Containers</Tab>
                </TabList>
              </div>
            </FluentProvider>
            <div className="navigation-divider">
              <Divider />
            </div>
            <div className="navigation-containers">
              {isSignedIn && false && (<>
                <ContainerSelector onContainerSelected={setSelectedContainer} />
                <CreateContainerButton />
              </>)}
            </div>
          </div>
          <div className="spe-app-content-main">
            <div className="main-content-header" />
            <div className="main-content-body">
              <Outlet context={{ selectedContainer, setSelectedContainer }} />
            </div>
          </div>
          <div className={`spe-app-content-sidebar${showSidebar ? '' : ' spe-app-content-sidebar--hidden'}`} ref={sidebarRef}>
            <div className="sidebar-resizer" ref={sidebarResizerRef} onMouseDown={onResizerMouseDown} />
            <div className="sidebar-content">
              <div className="spe-embedded-chat">
                {selectedContainer && (
                  <ChatSidebar container={selectedContainer} />
                )}
                {!selectedContainer && (
                  <Spinner
                    size='huge'
                    labelPosition='below'
                    label={
                      <Text size={600} weight='bold'>
                        Select a container to view chat
                      </Text>
                    } />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FluentProvider>
  );
}

export default App;
