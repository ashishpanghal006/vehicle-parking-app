export default {
    template: `
    <div style="position: relative; width: 100%; height: 88vh; overflow: hidden; border-radius: 0px; margin-top: 10px;">

        <!-- Background Image -->
        <img 
            src="static/carparking_image.jpg" 
            alt="Home"
            style="width: 100%; height: 100%; object-fit: cover; filter: brightness(70%);"
        >

        <!-- Text on Top -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">

            <h1 style="font-size: 48px; font-weight: 700; margin-bottom: 10px;">
                Welcome to Park<span style='color:#74b9ff;'>In</span>
            </h1>
            <p style="font-size: 20px; font-weight: 400; opacity: 0.9;">
                Your smarter way to park — fast, simple, reliable.
            </p>
            
        </div>

    </div>
    `
}
