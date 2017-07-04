import { config } from 'config'
import ReactGA from 'react-ga'

ReactGA.initialize(config.GA)

const logPageView = () => {
  if(process.env.NODE_ENV === 'production'){
    ReactGA.set({ page: window.location.pathname })
    ReactGA.pageview(window.location.pathname)
  }
}
export const onRouteUpdate = logPageView
