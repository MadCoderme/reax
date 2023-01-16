import React from "react"

export const Logger = ({ onMessage }) => {
    console.original = console.log
    console.log = (msg) => {
        onMessage(msg)
        console.original(msg)
    }
    return (
        <div></div>
    )
}