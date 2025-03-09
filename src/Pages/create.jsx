import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Slider, { sliderClasses } from "@mui/material/Slider";

export default function Create() {
    const isDark = useSelector((state) => state.theme.isDark);
    const [selectedTime, setSelectedTime] = useState("5+0");
    const [selectedColor, setSelectedColor] = useState("random");
    const [timeFormat, setTimeFormat] = useState("blitz");
    const [customTime, setCustomTime] = useState({ base: 5, increment: 0 });
    const [isCustom, setIsCustom] = useState(false);
    const [error, setError] = useState(null);

    const { roomid } = useParams();
    const socket = useRef(null);
    const navigate = useNavigate();

    const timeControls = {
        bullet: ["1+0", "1+1", "2+1"],
        blitz: ["3+0", "3+2", "5+0", "5+3"],
        rapid: ["10+0", "15+10", "30+0"],
        classical: ["45+45", "90+30"]
    };

    useEffect(() => {
        const BACKEND_WS_API = import.meta.env.VITE_BACKEND_CHESS_WS_API;
        socket.current = new WebSocket(BACKEND_WS_API + "/chess/" + roomid + "/?token=" + localStorage.getItem("token"));

        socket.current.onopen = () => {
            console.log("WebSocket connection established");
        };

        socket.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            // console.log('message received: ', message);
            if (message.message.info === "created") {
                navigate(`/online/${roomid}`);
            }
            if (message.message.info === 'invalid') {
                console.error(message.message.error);
                setError(message.message.error || "Unable to create game. It might already exist.");
            }
        };

        socket.current.onclose = () => {
            console.log("WebSocket connection closed");
        };

        socket.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setError("Connection error occurred. Please try again later.");
        };

        return () => {
            if (socket.current) socket.current.close();
        };
    }, [roomid, navigate]);

    const handleCreateGame = () => {
        const action = "create_game";
        let color = selectedColor;
        if (selectedColor === 'random') {
            const randomColor = Math.random() < 0.5 ? 'white' : 'black';
            color = randomColor;
        }
        let base, increment;

        if (isCustom) {
            base = customTime.base;
            increment = customTime.increment;
        } else {
            [base, increment] = selectedTime.split("+").map(Number);
        }

        if (socket.current) {
            socket.current.send(JSON.stringify({
                action,
                base,
                increment,
                color,
                format: timeFormat
            }));
        }
    };


    return (
        <div className={`min-h-screen w-full flex justify-center items-center p-2 sm:p-4 
            ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
            <div className={`p-4 sm:p-8 rounded-xl shadow-2xl w-full max-w-3xl
                ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

                {/* Error Message */}
                {error && (
                    <div className={`mb-6 p-4 rounded-lg border text-center ${
                        isDark ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-100 border-red-300 text-red-800'
                    }`}>
                        <p className="font-medium text-sm sm:text-base mb-2">{error}</p>
                        <p className="text-xs sm:text-sm">To create a new game, please return to the Connect page first.</p>
                        <button 
                            onClick={() => navigate('/connect')}
                            className="mt-3 px-4 py-1.5 rounded text-xs sm:text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                            Go to Connect Page
                        </button>
                    </div>
                )}

                {/* Color Selection */}
                <div className="mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">Choose Your Color</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                        {['random', 'white', 'black'].map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg capitalize transition-all duration-200 text-sm sm:text-base
                                    ${selectedColor === color
                                        ? 'bg-blue-500 text-white transform scale-105'
                                        : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Controls */}
                <div className="mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center">Time Control</h3>

                    {/* Time Format Tabs */}
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-600 justify-center">
                        {[...Object.keys(timeControls), 'custom'].map(format => (
                            <button
                                key={format}
                                onClick={() => {
                                    setTimeFormat(format);
                                    setIsCustom(format === 'custom');
                                    if (format !== 'custom') {
                                        setSelectedTime(timeControls[format][0]);
                                    }
                                }}
                                className={`px-2 sm:px-4 py-1 sm:py-2 capitalize transition-all duration-200 text-sm sm:text-base
                                    ${(timeFormat === format || (isCustom && format === 'custom'))
                                        ? `border-b-2 border-blue-500 text-blue-500`
                                        : `text-gray-400 hover:text-gray-300`}`}
                            >
                                {format}
                            </button>
                        ))}
                    </div>

                    {/* Time Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                        {!isCustom ? (
                            timeControls[timeFormat].map(time => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base
                                        ${selectedTime === time
                                            ? 'bg-blue-500 text-white transform scale-105'
                                            : isDark
                                                ? 'bg-gray-700 hover:bg-gray-600'
                                                : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    {time} minutes
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full space-y-4 sm:space-y-6 p-3 sm:p-4 rounded-lg bg-opacity-50">
                                <div>
                                    <label className="block mb-2 text-sm sm:text-base">Base Time: {customTime.base} minutes</label>
                                    <Slider
                                        value={customTime.base}
                                        onChange={(_, value) => setCustomTime(prev => ({ ...prev, base: value }))}
                                        min={1}
                                        max={180}
                                        sx={{
                                            color: isDark ? '#60a5fa' : '#3b82f6',
                                            '& .MuiSlider-thumb': {
                                                '&:hover, &.Mui-focusVisible': {
                                                    boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm sm:text-base">Increment: {customTime.increment} seconds</label>
                                    <Slider
                                        value={customTime.increment}
                                        onChange={(_, value) => setCustomTime(prev => ({ ...prev, increment: value }))}
                                        min={0}
                                        max={60}
                                        sx={{
                                            color: isDark ? '#60a5fa' : '#3b82f6',
                                            '& .MuiSlider-thumb': {
                                                '&:hover, &.Mui-focusVisible': {
                                                    boxShadow: '0 0 0 8px rgba(59, 130, 246, 0.16)',
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Game Button */}
                <button
                    onClick={handleCreateGame}
                    className="w-full py-3 sm:py-4 rounded-lg bg-blue-500 text-white font-bold text-sm sm:text-base
                             hover:bg-blue-600 transition-all duration-200 transform hover:scale-[1.02]"
                    disabled={!!error}
                >
                    Create Game
                </button>
            </div>
        </div>
    );
}
