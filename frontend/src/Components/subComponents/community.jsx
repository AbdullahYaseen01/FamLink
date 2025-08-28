import { useState } from "react";
import { navItemsArticles } from "../../Config/helpFunction";
import Search1 from "./search";
import { useLocation } from "react-router-dom";
import { Drawer } from "antd";
import menuIcon from '../../assets/images/menu.png'
import imgIcon from '../../assets/images/imgIcon.png'
import line from '../../assets/images/l1.png'
import { useSelector } from "react-redux";
import Avatar from "react-avatar";
import UserAvatar from "../../NewComponents/UserAvatar";

export default function CommunityPost() {
    const { user } = useSelector((s) => s.auth);
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
        <div className='padding-navbar1 Quicksand'>
            <div className='shadow my-10 bg-white lg:p-10 p-5 rounded-xl'>
                <div className="flex gap-6 justify-between items-end">
                    <h2 className="font-semibold text-4xl Livvic">Community</h2>
                    <div className="max-lg:hidden">
                        <Search1 onSearch={handleSearch} />
                    </div>

                </div>
                <div className="lg:hidden flex flex-wrap-reverse gap-6 justify-end">
                    <div className='my-5'>
                        <Search1 onSearch={handleSearch} />
                    </div>
                </div>

                <div className='lg:flex hidden mt-16 mb-4 bg-white  justify-between items-center h-20'>
                    {navItemsArticles.map((item) => (
                        <div
                            key={item}
                            data-value={item}
                            onClick={handleClick}
                            className='cursor-pointer flex'
                        >
                            <p
                                className={`font-normal text-center text-header-comm ${val === item ? 'text-[#38AEE3]' : 'text-black'
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
                <img onClick={() => setOpen(true)} src={menuIcon} alt="menu" className="w-6 h-6 lg:hidden block mt-6 mb-4 mx-2 hover:opacity-50 ease-out cursor-pointer" />
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
                                className={`cursor-pointer text-base text-center ${val === item ? 'text-[#38AEE3]' : 'text-black'
                                    }`}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </Drawer>

                <div className="grid items-start grid-cols-4 gap-4">
                    {/* Column 3 */}
                    <div className="border rounded-2xl border-[#D6DDEB] p-4 ">
                        <p className="lg:text-3xl text-xl Livvic">Post 1</p>
                        <p className="py-3">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                        <p>Created by: Admin</p>
                        <p className="py-3">Posted on: 20 June 2024 @ 9:30am</p>
                    </div>

                    {/* Column 1 and 2 inside a col-span-2 wrapper */}
                    <div className="col-span-2 gap-4">
                        <div className="flex items-start gap-4 border p-4 rounded-2xl border-[#D6DDEB]">
                            {/* {user.imageUrl ? (
                                <img
                                    style={{ borderRadius: "100px" }}
                                    src={user.imageUrl}
                                    alt="avatar"
                                    className="rounded-full size-20 object-cover"
                                />
                            ) : (
                                <Avatar
                                    className="rounded-full text-black"
                                    size="80"
                                    color={"#38AEE3"}
                                    name={user.name?.split(' ') // Split by space
                                        .slice(0, 2) // Take first 1–2 words
                                        .join(' ')}
                                />
                            )} */}
                            <UserAvatar user={user}/>

                            {/* Wrap input and Photos vertically */}
                            <div className="flex-1 flex flex-col gap-4">
                                <div className="flex items-center border p-4 rounded-full border-[#D6DDEB]">
                                    <p className="text-[#878A99] text-xl">Write your post..........</p>
                                </div>
                                <div className="flex items-center  gap-2 pl-4">
                                    <img src={imgIcon} alt="imgIcon" />
                                    <p>Photos</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Column 4 */}
                    <div className="border rounded-2xl border-[#D6DDEB] p-4">Column 4</div>
                </div>
            </div>
        </div>
    )
}