 import React, { createContext, useContext, useState, useEffect } from 'react'

const SlipContext = createContext()

export function SlipProvider({ children }) {
    const [slip, setSlip] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [totalOdds, setTotalOdds] = useState(0)

    useEffect(() => {
        const savedSlip = localStorage.getItem('predictfc_slip')
        if (savedSlip) {
            try {
                setSlip(JSON.parse(savedSlip))
            } catch (e) {
                setSlip([])
            }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('predictfc_slip', JSON.stringify(slip))
        let odds = 1
        slip.forEach(item => {
            if (item.odds) odds *= item.odds
        })
        setTotalOdds(odds)
    }, [slip])

    const addToSlip = (match, outcome = 'Draw', odds = 2.0) => {
        const existing = slip.find(item => item.matchId === match.idEvent)
        if (existing) {
            setSlip(slip.map(item => 
                item.matchId === match.idEvent 
                    ? { ...item, outcome, odds }
                    : item
            ))
        } else {
            setSlip([...slip, {
                matchId: match.idEvent,
                match: match,
                outcome,
                odds,
                homeTeam: match.strHomeTeam,
                awayTeam: match.strAwayTeam
            }])
        }
        setIsOpen(true)
    }

    const removeFromSlip = (matchId) => {
        setSlip(slip.filter(item => item.matchId !== matchId))
        if (slip.length <= 1) setIsOpen(false)
    }

    const clearSlip = () => {
        setSlip([])
        setIsOpen(false)
    }

    const isInSlip = (matchId) => {
        return slip.some(item => item.matchId === matchId)
    }

    const getSlipCount = () => {
        return slip.length
    }

    const value = {
        slip,
        isOpen,
        setIsOpen,
        totalOdds,
        addToSlip,
        removeFromSlip,
        clearSlip,
        isInSlip,
        getSlipCount
    }

    return (
        <SlipContext.Provider value={value}>
            {children}
        </SlipContext.Provider>
    )
}

export function useSlip() {
    const context = useContext(SlipContext)
    if (!context) {
        throw new Error('useSlip must be used within a SlipProvider')
    }
    return context
}