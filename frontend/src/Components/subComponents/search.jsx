
import { Button, Form, Input } from 'antd';

import { Search } from 'lucide-react'

export default function Search1({ onSearch }) {
    const [form] = Form.useForm();
    const onFinish = (values) => {
        onSearch(values.search);
    };
    
    return (
        <Form
            form={form}
            name="basic"
            style={{
                width: '100%',
                margin: 0,
                padding: 0,
            }}
            initialValues={{
                remember: true,
            }}
            onFinish={onFinish}
            autoComplete="off"
        >
            <div style={{ background: "#F4F4F4" }} className='flex items-center rounded-xl gap-2 p-2 flex-grow' >
                <Form.Item
                    name="search"
                    rules={[
                        {
                            required: true,
                            message: ""
                        },
                    ]}
                    style={{ boxShadow: 'none' }}
                    className='m-0 p-0 flex-1 bg-none'
                >
                    <Input prefix={<Search color='#6F767E' className='w-4' />}
                        onFocus={(e) => e.target.style.boxShadow = "none"}
                        onBlur={(e) => e.target.style.boxShadow = "none"}  style={{ background: "#F4F4F4", boxShadow: "none", border: 'none' }}  className='w-full border-none h-7' type='text' placeholder='Aa' />
                </Form.Item>
                <Form.Item className='m-0 p-0'>
                    <Button className='border-none Livvic-SemiBold' htmlType="submit">
                        Search
                    </Button>
                </Form.Item>
            </div>
        </Form>
    )
}