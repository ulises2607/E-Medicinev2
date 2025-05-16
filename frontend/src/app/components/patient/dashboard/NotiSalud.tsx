import Image from "next/image";
const NotiSalud = () => {
  return (
    <div>
      <h2 className="font-semibold text-[15.58px] -mb-4 text-center">
        Noti-salud
      </h2>
      <div className="w-full p-4 mb-4 ">
        <div className="grid grid-cols-3 gap-4 relative p-4 ">
          <div className="relative">
            <Image
              className="rounded-[11px,11px,0,0] object-cover"
              src="/home/jesse-orrico-rmWtVQN5RzU-unsplash 1.png"
              alt="Notification 1"
              width={97}
              height={100}
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white opacity-100"></div>
          </div>
          <div className="relative">
            <Image
              className="rounded-[11px,11px,0,0] object-cover"
              src="/home/alison-marras-LI368L2RZno-unsplash 1.png"
              alt="Notification 2"
              width={97}
              height={100}
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white opacity-100"></div>
          </div>
          <div className="relative">
            <Image
              className="rounded-[11px,11px,0,0] object-cover"
              src="/home/nguy-n-hi-p-2rNHliX6XHk-unsplash 1.png"
              alt="Notification 3"
              width={97}
              height={100}
            />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white opacity-100"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotiSalud;
