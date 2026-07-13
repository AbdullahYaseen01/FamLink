


export default function TabContent({img, head, para}){
    return (
        <div className="text-start tab">
            <div className="flex gap-4">
                <img src={img} alt={img} />
                <p className="Livvic text-2xl Livvic-Bold">{head}</p>
            </div>
            <p className="ml-12 my-2">{para}</p>
        </div>
    )
}