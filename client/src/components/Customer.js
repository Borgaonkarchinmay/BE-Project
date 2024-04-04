import React , {useEffect, useState} from 'react';
import Axios from 'axios';
import {CustomerNavBar} from "./CustomerNavBar";
import './styles/style.css';

export const Customer = ()=> {

     //Initialization
     const [userId, setUserId] = useState(0);
     const [userName, setuserName] = useState('');
     const [cust_name, set_cust_name] = useState('');
     const [cust_addr, set_cust_addr] = useState('');
     const [cust_mobno, set_cust_mobno] = useState('');

     const [vehId, setVehId] = useState(0);
     const [td_date, set_td_date] = useState(null);
     const [td_slot, set_td_slot] = useState('');
     const [vehList, setVehList] = useState([]);
 
     Axios.defaults.withCredentials = true;
 
         
     //Required methods
     useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

     useEffect(()=> {
         Axios.get("/api/registration/login").then((response) => {
             console.log("after cookie");
             if(response.data.loggedIn){
                 console.log(response);
                 setUserId(response.data.user[0].cid);
                 setuserName(response.data.user[0].username);
             }
         });
     }, []);

     useEffect(()=> {
        Axios.get("/api/vehicle/vehDetails").then((response) => {
            console.log("after cookie");
            
           setVehList(
                response.data.map((val)=>{
                    return {value : val.vehid, text : "Model: " + val.model + "   " + "Type: " + val.type};
                })
            );
        });
    }, []);


    const handleChange = event => {
        console.log(event.target.value);
        setVehId(event.target.value);
    };


     const profile = ()=>{
        Axios.post("/api/customer/customerDetails",{
            id : userId
        }).then((response)=> {  
            set_cust_name(response.data[0].name);
            set_cust_addr(response.data[0].addr);
            set_cust_mobno(response.data[0].mobno);
            console.log(response);
        });
    };

    const bookTestDrive = async ()=> {
        
        // creating a new order
        const result = await Axios.post("/api/payment/create-orders", { 
            amount : 100000, currency : "INR"
        });

        // Getting the order details back
        const { amount, id: order_id, currency } = result.data;

        const options = {
            key: "rzp_test_tlLFJ93Dvp72rB", // Enter the Key ID generated from the Dashboard
            amount: amount.toString(),
            currency: currency,
            name: "Testdrive Booking Portal",
            description: "Booking Payment",
            order_id: order_id,
            handler: async function (response) {
                const data = {
                    orderCreationId: order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                };

                const result = await Axios.post("/api/payment/success-verification", data);

                if(result.data.msg == "success" && td_date != null && td_slot.length > 0 && td_date.vehId !== 0){     
                  const bookingResponse = await Axios.post("/api/customer/bookTestDrive", { 
                              cid : userId, 
                              vid : vehId, 
                              date : td_date, 
                              slot : td_slot
                  });
                  alert('success');
                  }
                  else{
                    alert("Fill required information & check pay status");
                  }
              
            },
            theme: {
                color: "#61dafb",
            },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open(); 

        
      };


    //-----------------------------------------------------------------------
    
    return (
        <div>
           
           {<CustomerNavBar/>}
           <div className='profile book'>
           
            
            <div class='head'><h2>Book a test drive</h2></div>
            <div className='book'>   
                <div >
                    <br></br>
                    <br></br>
                    <label>VEHICLE </label>
                    <br></br>
                    <label>(a: Automatic/ m : manual)</label>
                    <br></br>
                    <div><select value={vehId} onChange={handleChange}>
                        <option values = {vehId}>Select Vehicle</option>
                        {vehList.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.text}
                        </option>
                        ))}
                    </select></div>
                    </div>
                    <br></br>
                    
                    <div>
                    <label>DATE</label>
                    <div><input type = "date"  
                    onChange={(event)=> {
                        set_td_date(event.target.value);
                        }}
                    />
                    </div>
                    </div>
                    <br></br>
                    <div>
                    <label>SLOT</label>
                    
                    <br></br>
                    <div>
                    <select
                        value={td_slot}
                        onChange={(event) =>{
                            set_td_slot(event.target.value);
                        }}
                    >
                        <option values = "">select time slot</option>
                        <option values = "10:11">10:00 am: 11:00 am</option>
                        <option values = "11:12">11:00 am: 12:00 pm</option>
                        <option values = "3:4">3:00 pm : 4:00 pm</option>
                        <option values = "4:5">4:00 pm : 5:00 pm</option>
                        <option values = "5:6">5:00 pm : 6:00 pm</option>
                    </select>
                    </div>
                    </div>
                    <br></br>
                    <br></br>
                    <button onClick = {bookTestDrive}>Pay to book (1000 INR)</button>

                </div>
            </div>    

        </div>
    );
}