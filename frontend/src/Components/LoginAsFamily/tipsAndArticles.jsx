import { useState } from 'react'
import Search from '../subComponents/search'
import line from '../../assets/images/l1.png'
import PagComm from './subcomponents/paginationComm'
import { useLocation } from 'react-router-dom'
import { Drawer } from 'antd'
import menuIcon from "../../assets/images/menu.png"
import { navItemsArticles } from '../../Config/helpFunction'
export default function TipsAndArticles() {
  const handleSearch = searchValue => {
    ('Search Value:', searchValue) // Use the search value here
  }
  const location = useLocation()
  const { v } = location.state || {}
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(v ? v : 'Community Resources')
  const handleClick = e => {
    const value = e.currentTarget.getAttribute('data-value')
    setVal(e.currentTarget.dataset.value);
    setOpen(false);
    setVal(value) // Do something with the value
  }

  return (
    <div>
      <div className='lg:flex hidden border-[1px] border-[#D6DDEB] bg-white -mt-8 justify-between items-center h-20 padding-navbar1'>
        {navItemsArticles.map((item) => (
          <div
            key={item}
            data-value={item}
            onClick={handleClick}
            className='cursor-pointer flex'
          >
            <p
              className={`font-normal text-center text-header-comm ${val === item ? 'text-[#AEC4FF]' : 'text-black'
                }`}
            >
              {item}
            </p>
            {
              item == 'Community Resources' &&
              <img src={line} className='ml-12 disp-none' alt='line' />
            }
          </div>
        ))}
      </div>
      <img onClick={() => setOpen(true)} src={menuIcon} alt="menu" className="w-6 h-6 lg:hidden block mx-2 hover:opacity-50 ease-out cursor-pointer" />
      {/* Ant Design Drawer */}
      <Drawer
        closable={false}
        placement="bottom"
        onClose={() => setOpen(false)}
        open={open}
      >
        <div className="flex flex-col gap-4">
          {navItemsArticles.map((item) => (
            <div
              key={item}
              data-value={item}
              onClick={handleClick}
              className={`cursor-pointer text-base text-center ${val === item ? 'text-[#AEC4FF]' : 'text-black'
                }`}
            >
              {item}
            </div>
          ))}
        </div>
      </Drawer>
      <div className='padding-navbar1  Quicksand'>
        <div className='shadow border-[1px] border-[#D6DDEB] bg-white my-10 rounded-xl'>
          <p className='Livvic-Bold lg:text-3xl text-2xl uppercase edit-padding'>
            Famlink {val.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}
          </p>
          <div className='flex justify-end padding-navbar1'>
            <div>
              <Search onSearch={handleSearch} />
            </div>
          </div>
          <div className='pt-4 pb-10 padding-sub'>
            <div className='pt-4 pb-10 padding-sub'>
              <PagComm category={val} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
