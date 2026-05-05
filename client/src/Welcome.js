import React, { Component } from 'react';

class Welcome extends Component {
    render() {
        return (
            <div className="connection-badge">
                <span className="dot"></span>
                Connected to MongoDB
            </div>
        );
    }
}

export default Welcome;