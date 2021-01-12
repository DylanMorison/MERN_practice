import { Fragment } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react";
import { Navbar } from "./components/layout/Navbar";
import { Landing } from "./components/layout/Landing";

const App = () => {
	return (
		<Fragment>
			<Navbar />
			<Landing />
		</Fragment>
	);
};

export default App;
