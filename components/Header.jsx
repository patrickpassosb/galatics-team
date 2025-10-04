import React from 'react'
import { Rocket, Info } from 'lucide-react'

function Header() {
  return (
    <div className='absolute top-0 left-0 right-0 bg-space-medium/90 backdrop-blur-sm 
                    text-white p-4 shadow-lg z-10'>
      <div className='flex items-center justify-between max-w-7xl mx-auto'>
        <div className='flex items-center gap-3'>
          <Rocket size={32} className='text-blue-400' />
          <div>
            <h1 className='text-2xl font-bold'>Asteroid Impact Simulator</h1>
            <p className='text-sm text-gray-300'>
              Interactive 3D visualization powered by NASA data
            </p>
          </div>
        </div>
        
        <div className='flex items-center gap-4'>
          <a
            href='https://api.nasa.gov'
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-blue-400 hover:text-blue-300 transition-colors'
          >
            NASA API
          </a>
          <a
            href='https://www.usgs.gov'
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-blue-400 hover:text-blue-300 transition-colors'
          >
            USGS Data
          </a>
        </div>
      </div>
    </div>
  )
}

export default Header
