import React from 'react';
import { Link } from 'react-router-dom';
import { Panel, PanelHeader, PanelBody } from './../../components/panel/panel.jsx';
import { PageSettings } from './../../config/page-settings.js';

class PageWithBoxedLayout extends React.Component {
	static contextType = PageSettings;

	componentDidMount() {
		this.context.handleSetPageBoxedLayout(true);
	}

	componentWillUnmount() {
		this.context.handleSetPageBoxedLayout(false);
	}
	
	render() {
		return (
			<div>
				<ol className="breadcrumb pull-right">
					<li className="breadcrumb-item"><Link to="/page-option/with-boxed-layout">Home</Link></li>
					<li className="breadcrumb-item"><Link to="/page-option/with-boxed-layout">Page Options</Link></li>
					<li className="breadcrumb-item active">Page with Boxed Layout</li>
				</ol>
				<h1 className="page-header">Page with Boxed Layout <small>header small text goes here...</small></h1>
				<Panel>
					<PanelHeader>Panel Title here</PanelHeader>
					<PanelBody>
						Panel Content Here
					</PanelBody>
				</Panel>
			</div>
		)
	}
}

export default PageWithBoxedLayout;