 import React, { useState, useEffect } from 'react'
import { Joyride } from 'react-joyride'
import { useAuth } from '../contexts/AuthContext'
import { Trophy, Lock } from 'lucide-react'

export default function OnboardingTour() {
    const { user } = useAuth()
    const [run, setRun] = useState(false)

    useEffect(() => {
        const hasSeenTour = localStorage.getItem(`predictfc_tour_${user?.id}`)
        
        if (user && !hasSeenTour) {
            const timer = setTimeout(() => {
                setRun(true)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [user])

    const handleTourFinish = () => {
        localStorage.setItem(`predictfc_tour_${user?.id}`, 'true')
        setRun(false)
    }

    const steps = [
        // Step 1: Welcome
        {
            target: 'body',
            content: (
                <div className="text-center max-w-sm">
                    <h3 className="font-bold text-xl mb-3 text-gray-900">👋 Welcome to PredictFC!</h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                        Your home for football predictions, communities, and AI-powered insights.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Let's show you around.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
            hideCloseButton: true,
        },
        
        // Step 2: Feed
        {
            target: '.tour-feed',
            content: (
                <div className="max-w-sm">
                    <h4 className="font-bold text-lg mb-1 text-gray-900">📰 Your Feed</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        See posts, public predictions, and updates from the community.
                    </p>
                </div>
            ),
            placement: 'bottom',
            spotlightClicks: true,
        },
        
        // Step 3: Matches
        {
            target: '.tour-matches',
            content: (
                <div className="max-w-sm">
                    <h4 className="font-bold text-lg mb-1 text-gray-900">⚽ Matches</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        View all upcoming fixtures and share your predictions with the world.
                    </p>
                </div>
            ),
            placement: 'bottom',
            spotlightClicks: true,
        },
        
        // Step 4: Community
        {
            target: '.tour-community',
            content: (
                <div className="max-w-sm">
                    <h4 className="font-bold text-lg mb-1 text-gray-900">🏛️ Communities</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Join or create private paid communities to predict with friends and fans.
                    </p>
                </div>
            ),
            placement: 'bottom',
            spotlightClicks: true,
        },
        
        // Step 5: Slip
        {
            target: '.tour-slip',
            content: (
                <div className="max-w-sm">
                    <h4 className="font-bold text-lg mb-1 text-gray-900">📋 Bet Slip</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Build multi-match predictions and share your strategy with followers.
                    </p>
                </div>
            ),
            placement: 'bottom',
            spotlightClicks: true,
        },

        // Step 6: Leaderboard (PREMIUM FEATURE)
        {
            target: '.tour-leaderboard',
            content: (
                <div className="max-w-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <h4 className="font-bold text-lg text-gray-900">🏆 Leaderboard</h4>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Premium</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        See who's winning! The Leaderboard shows the most liked predictions.
                    </p>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                        <Lock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-800 leading-relaxed">
                            <strong>Premium Feature:</strong> Unlock full access for just <strong>R40/month</strong>.
                        </p>
                    </div>
                </div>
            ),
            placement: 'bottom',
            spotlightClicks: true,
        },

        // Step 7: Profile (BOTTOM NAV)
        {
            target: '.tour-profile-bottom',
            content: (
                <div className="max-w-sm">
                    <h4 className="font-bold text-lg mb-1 text-gray-900">👤 Your Profile</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        View your stats, points, accuracy, and manage your account settings.
                    </p>
                </div>
            ),
            placement: 'top',
            spotlightClicks: true,
        },
        
        // Step 8: Notifications (BOTTOM NAV)
        {
            target: '.tour-notifications-bottom',
            content: (
                <div className="max-w-sm">
                    <h4 className="font-bold text-lg mb-1 text-gray-900">🔔 Notifications</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Stay updated when someone likes, comments, or follows you.
                    </p>
                </div>
            ),
            placement: 'top',
            spotlightClicks: true,
        },
        
        // Step 9: Inbox (BOTTOM NAV)
        {
            target: '.tour-inbox-bottom',
            content: (
                <div className="max-w-sm">
                    <h4 className="font-bold text-lg mb-1 text-gray-900">💬 Inbox</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Chat directly with other users in your private messages.
                    </p>
                </div>
            ),
            placement: 'top',
            spotlightClicks: true,
        },
        
        // Step 10: Finished
        {
            target: 'body',
            content: (
                <div className="text-center max-w-sm">
                    <h3 className="font-bold text-xl mb-3 text-gray-900">🎉 You're ready!</h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                        Start predicting, earning points, and climbing the leaderboard!
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Remember, the Leaderboard is Premium — unlock it for R40/month.</p>
                </div>
            ),
            placement: 'center',
        },
    ]

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            hideCloseButton={true}
            disableOverlayClose={true}
            spotlightPadding={10}
            floaterProps={{
                hideArrow: false,
                disableAnimation: false,
            }}
            styles={{
                options: {
                    primaryColor: '#1a1a1a',
                    backgroundColor: '#ffffff',
                    textColor: '#1a1a1a',
                    arrowColor: '#ffffff',
                    zIndex: 10000,
                },
                buttonNext: {
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
                buttonBack: {
                    color: '#666666',
                    padding: '10px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                },
                buttonSkip: {
                    color: '#999999',
                    padding: '10px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                },
                spotlight: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
                tooltip: {
                    padding: '20px',
                    borderRadius: '16px',
                    maxWidth: '340px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                },
                tooltipContent: {
                    padding: '0',
                },
                tooltipFooter: {
                    marginTop: '16px',
                    padding: '0',
                },
            }}
            callback={(data) => {
                if (data.status === 'finished' || data.status === 'skipped') {
                    handleTourFinish()
                }
            }}
        />
    )
}